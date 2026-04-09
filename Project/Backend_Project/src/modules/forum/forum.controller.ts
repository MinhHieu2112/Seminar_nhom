import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ForumService } from './forum.service';
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

@Controller('forum')
@UseGuards(AuthGuard)
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Post('questions')
  async createQuestion(@Request() req: any, @Body() dto: CreateQuestionDto): Promise<QuestionDto> {
    return this.forumService.createQuestion(req.user.id, dto);
  }

  @Get('questions')
  async getQuestions(@Query() query: QuestionQueryDto): Promise<QuestionDto[]> {
    return this.forumService.getQuestions(query);
  }

  @Get('questions/:id')
  async getQuestionById(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<QuestionDto> {
    return this.forumService.getQuestionById(id, req.user?.id);
  }

  @Post('questions/:questionId/answers')
  async createAnswer(
    @Param('questionId') questionId: string,
    @Request() req: any,
    @Body() dto: CreateAnswerDto,
  ): Promise<AnswerDto> {
    return this.forumService.createAnswer(req.user.id, questionId, dto);
  }

  @Put('questions/:questionId/answers/:answerId/accept')
  async acceptAnswer(
    @Param('questionId') questionId: string,
    @Param('answerId') answerId: string,
    @Request() req: any,
  ): Promise<AnswerDto> {
    return this.forumService.acceptAnswer(req.user.id, questionId, answerId);
  }

  @Get('questions/:questionId/answers')
  async getAnswersForQuestion(@Param('questionId') questionId: string): Promise<AnswerDto[]> {
    return this.forumService.getAnswersForQuestion(questionId);
  }

  @Post('questions/:id/vote')
  async voteQuestion(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: VoteDto,
  ): Promise<VoteResponseDto> {
    return this.forumService.vote(req.user.id, id, ForumEntityType.QUESTION, dto);
  }

  @Post('answers/:id/vote')
  async voteAnswer(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: VoteDto,
  ): Promise<VoteResponseDto> {
    return this.forumService.vote(req.user.id, id, ForumEntityType.ANSWER, dto);
  }
}
