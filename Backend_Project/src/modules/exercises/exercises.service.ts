import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { ListExercisesDto } from './dto/list-exercises.dto';
import { ExerciseDetailDto, ExerciseListItemDto } from './dto/exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async listExercises(query: ListExercisesDto): Promise<ExerciseListItemDto[]> {
    const where: any = { deleted_at: null };

    if (query.difficulty) where.difficulty = query.difficulty;

    if (query.lesson_id) {
      const lessonId = BigInt(query.lesson_id);
      where.lesson_id = lessonId;
    }

    const exercises = await this.prisma.exercises.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        lesson_id: true,
        title: true,
        description: true,
        difficulty: true,
      },
    });

    return exercises.map((e) => ({
      id: e.id.toString(),
      lesson_id: e.lesson_id ? e.lesson_id.toString() : null,
      title: e.title,
      description: e.description,
      difficulty: e.difficulty,
    }));
  }

  async getExerciseDetail(exerciseId: string): Promise<ExerciseDetailDto> {
    let id: bigint;
    try {
      id = BigInt(exerciseId);
    } catch {
      throw new BadRequestException('Invalid exercise id');
    }

    const exercise = await this.prisma.exercises.findFirst({
      where: { id, deleted_at: null },
      include: {
        test_cases: {
          where: { is_hidden: false },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            input_data: true,
            expected_output_data: true,
            score_weight: true,
          },
        },
      },
    });

    if (!exercise) throw new NotFoundException('Exercise not found');

    return {
      id: exercise.id.toString(),
      lesson_id: exercise.lesson_id ? exercise.lesson_id.toString() : null,
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty,
      initial_code: exercise.initial_code,
      test_cases_public: exercise.test_cases.map((tc) => ({
        id: tc.id.toString(),
        input_data: tc.input_data,
        expected_output_data: tc.expected_output_data,
        score_weight: tc.score_weight,
      })),
    };
  }
}
