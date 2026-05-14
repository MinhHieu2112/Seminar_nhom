import { IsString, IsNotEmpty, IsOptional, IsHexColor } from 'class-validator';

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
  dayOfWeek: number; // 0-6
}

export class CreateTaskDto {
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
