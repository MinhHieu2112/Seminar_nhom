import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ForumEntityType {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

export enum VoteType {
  UPVOTE = 1,
  DOWNVOTE = -1,
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsUUID()
  lesson_id?: string;
}

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class VoteDto {
  @IsEnum(VoteType)
  vote_type!: VoteType;
}

export class QuestionQueryDto {
  @IsOptional()
  @IsString()
  lesson_id?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'most_viewed', 'most_answered'])
  sort?: string = 'newest';
}

export class QuestionDto {
  id!: string;
  user_id!: string;
  lesson_id?: string;
  title!: string;
  content!: string;
  view_count!: number;
  is_resolved!: boolean;
  created_at!: string;
  updated_at!: string;
  answer_count?: number;
  accepted_answer_id?: string;
  user?: {
    id: string;
    username: string;
  };
}

export class AnswerDto {
  id!: string;
  question_id!: string;
  user_id!: string;
  content!: string;
  is_accepted!: boolean;
  created_at!: string;
  updated_at!: string;
  user?: {
    id: string;
    username: string;
  };
  vote_score?: number;
}

export class VoteResponseDto {
  id!: string;
  entity_type!: ForumEntityType;
  entity_id!: string;
  vote_type!: number;
  created_at!: string;
}
