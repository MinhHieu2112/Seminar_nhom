import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateQuestionDto,
  CreateAnswerDto,
  VoteDto,
  QuestionQueryDto,
  QuestionDto,
  AnswerDto,
  VoteResponseDto,
  ForumEntityType,
} from './dto/forum.dto';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuestion(userId: string, dto: CreateQuestionDto): Promise<QuestionDto> {
    const question = await this.prisma.forum_questions.create({
      data: {
        user_id: BigInt(userId),
        lesson_id: dto.lesson_id ? BigInt(dto.lesson_id) : null,
        title: dto.title,
        content: dto.content,
        view_count: 0,
        is_resolved: false,
      },
      include: {
        users: {
          select: { id: true, username: true },
        },
      },
    });

    return this.mapQuestion(question);
  }

  async getQuestions(query: QuestionQueryDto): Promise<QuestionDto[]> {
    const where: any = {};

    if (query.lesson_id) {
      where.lesson_id = BigInt(query.lesson_id);
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };

    switch (query.sort) {
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      case 'most_viewed':
        orderBy = { view_count: 'desc' };
        break;
      case 'most_answered':
        // Will be handled with a raw query for better performance
        break;
    }

    if (query.sort === 'most_answered') {
      // Use raw query for most answered sorting
      const questions = await this.prisma.$queryRaw<any[]>`
        SELECT 
          q.id,
          q.user_id,
          q.lesson_id,
          q.title,
          q.content,
          q.view_count,
          q.is_resolved,
          q.created_at,
          q.updated_at,
          u.username,
          COUNT(fa.id) as answer_count
        FROM forum_questions q
        LEFT JOIN forum_answers fa ON q.id = fa.question_id
        LEFT JOIN public_users u ON q.user_id = u.id
        WHERE ${query.lesson_id ? Prisma.sql`q.lesson_id = ${BigInt(query.lesson_id)}` : Prisma.sql`TRUE`}
        ${query.search ? Prisma.sql`AND (q.title ILIKE ${'%' + query.search + '%'} OR q.content ILIKE ${'%' + query.search + '%'})` : Prisma.sql``}
        GROUP BY q.id, u.username
        ORDER BY answer_count DESC, q.created_at DESC
      `;

      return questions.map((q: any) => ({
        id: q.id.toString(),
        user_id: q.user_id.toString(),
        lesson_id: q.lesson_id?.toString(),
        title: q.title,
        content: q.content,
        view_count: Number(q.view_count),
        is_resolved: q.is_resolved,
        created_at: q.created_at.toISOString(),
        updated_at: q.updated_at.toISOString(),
        answer_count: Number(q.answer_count),
        user: {
          id: q.user_id.toString(),
          username: q.username,
        },
      }));
    }

    const questions = await this.prisma.forum_questions.findMany({
      where,
      orderBy,
      include: {
        users: {
          select: { id: true, username: true },
        },
        _count: {
          select: { forum_answers: true },
        },
      },
    });

    return questions.map((q) => ({
      ...this.mapQuestion(q),
      answer_count: q._count.forum_answers,
    }));
  }

  async getQuestionById(questionId: string, userId?: string): Promise<QuestionDto> {
    const question = await this.prisma.forum_questions.findUnique({
      where: { id: BigInt(questionId) },
      include: {
        users: {
          select: { id: true, username: true },
        },
        forum_answers: {
          include: {
            users: {
              select: { id: true, username: true },
            },
          },
          orderBy: { created_at: 'asc' },
        },
        _count: {
          select: { forum_answers: true },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Increment view count (but not for the question owner)
    if (!userId || BigInt(userId) !== question.user_id) {
      await this.prisma.forum_questions.update({
        where: { id: BigInt(questionId) },
        data: { view_count: { increment: 1 } },
      });
    }

    const result = this.mapQuestion(question);
    result.answer_count = question._count.forum_answers;

    return result;
  }

  async createAnswer(userId: string, questionId: string, dto: CreateAnswerDto): Promise<AnswerDto> {
    // Check if question exists
    const question = await this.prisma.forum_questions.findUnique({
      where: { id: BigInt(questionId) },
      select: { id: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const answer = await this.prisma.forum_answers.create({
      data: {
        question_id: BigInt(questionId),
        user_id: BigInt(userId),
        content: dto.content,
        is_accepted: false,
      },
      include: {
        users: {
          select: { id: true, username: true },
        },
      },
    });

    return this.mapAnswer(answer);
  }

  async acceptAnswer(userId: string, questionId: string, answerId: string): Promise<AnswerDto> {
    return this.prisma.$transaction(async (tx) => {
      // Verify question ownership
      const question = await tx.forum_questions.findUnique({
        where: { id: BigInt(questionId) },
        select: { user_id: true },
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      if (question.user_id !== BigInt(userId)) {
        throw new ForbiddenException('Only question owner can accept answers');
      }

      // Verify answer belongs to question
      const answer = await tx.forum_answers.findUnique({
        where: { id: BigInt(answerId) },
        select: { question_id: true },
      });

      if (!answer || answer.question_id !== BigInt(questionId)) {
        throw new NotFoundException('Answer not found for this question');
      }

      // Unaccept all other answers and accept this one
      await tx.forum_answers.updateMany({
        where: { question_id: BigInt(questionId) },
        data: { is_accepted: false },
      });

      const updatedAnswer = await tx.forum_answers.update({
        where: { id: BigInt(answerId) },
        data: { is_accepted: true },
        include: {
          users: {
            select: { id: true, username: true },
          },
        },
      });

      // Mark question as resolved
      await tx.forum_questions.update({
        where: { id: BigInt(questionId) },
        data: { is_resolved: true },
      });

      return this.mapAnswer(updatedAnswer);
    });
  }

  async vote(userId: string, entityId: string, entityType: ForumEntityType, dto: VoteDto): Promise<VoteResponseDto> {
    const entityBigInt = BigInt(entityId);
    const userBigInt = BigInt(userId);

    // Verify entity exists
    if (entityType === ForumEntityType.QUESTION) {
      const question = await this.prisma.forum_questions.findUnique({
        where: { id: entityBigInt },
        select: { id: true },
      });
      if (!question) throw new NotFoundException('Question not found');
    } else {
      const answer = await this.prisma.forum_answers.findUnique({
        where: { id: entityBigInt },
        select: { id: true },
      });
      if (!answer) throw new NotFoundException('Answer not found');
    }

    // Upsert vote (idempotent)
    const vote = await this.prisma.forum_votes.upsert({
      where: {
        user_id_entity_type_entity_id: {
          user_id: userBigInt,
          entity_type: entityType,
          entity_id: entityBigInt,
        },
      },
      update: {
        vote_type: dto.vote_type,
      },
      create: {
        user_id: userBigInt,
        entity_type: entityType,
        entity_id: entityBigInt,
        vote_type: dto.vote_type,
      },
    });

    return {
      id: vote.id.toString(),
      entity_type: vote.entity_type as ForumEntityType,
      entity_id: vote.entity_id.toString(),
      vote_type: vote.vote_type,
      created_at: vote.created_at?.toISOString() || '',
    };
  }

  async getAnswersForQuestion(questionId: string): Promise<AnswerDto[]> {
    const answers = await this.prisma.forum_answers.findMany({
      where: { question_id: BigInt(questionId) },
      include: {
        users: {
          select: { id: true, username: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Calculate vote scores for each answer
    const result = [];
    for (const answer of answers) {
      const voteScore = await this.prisma.forum_votes.aggregate({
        where: {
          entity_type: ForumEntityType.ANSWER,
          entity_id: answer.id,
        },
        _sum: {
          vote_type: true,
        },
      });

      result.push({
        ...this.mapAnswer(answer),
        vote_score: voteScore._sum.vote_type || 0,
      });
    }

    return result;
  }

  private mapQuestion(question: any): QuestionDto {
    return {
      id: question.id.toString(),
      user_id: question.user_id.toString(),
      lesson_id: question.lesson_id?.toString(),
      title: question.title,
      content: question.content,
      view_count: Number(question.view_count),
      is_resolved: question.is_resolved,
      created_at: question.created_at?.toISOString() || '',
      updated_at: question.updated_at?.toISOString() || '',
      user: question.users
        ? {
            id: question.users.id.toString(),
            username: question.users.username,
          }
        : undefined,
    };
  }

  private mapAnswer(answer: any): AnswerDto {
    return {
      id: answer.id.toString(),
      question_id: answer.question_id.toString(),
      user_id: answer.user_id.toString(),
      content: answer.content,
      is_accepted: answer.is_accepted,
      created_at: answer.created_at?.toISOString() || '',
      updated_at: answer.updated_at?.toISOString() || '',
      user: answer.users
        ? {
            id: answer.users.id.toString(),
            username: answer.users.username,
          }
        : undefined,
    };
  }
}
