import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsHexColor,
  IsNumber,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  startTime: string; // ISO string

  @IsString()
  @IsNotEmpty()
  endTime: string; // ISO string

  @IsNotEmpty()
  @IsNumber()
  dayOfWeek: number;

  @IsOptional()
  @IsString()
  groupId?: string;
}

export class CreateTaskDto {
  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueTime?: string; // ISO string

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueTime?: string | null;

  @IsOptional()
  @IsString()
  subjectId?: string | null;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateTaskAllocationDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  startTime: string; // ISO string

  @IsString()
  @IsNotEmpty()
  endTime: string; // ISO string
}

export class UpdateUserPreferenceDto {
  @IsNotEmpty()
  settings: any;
}
