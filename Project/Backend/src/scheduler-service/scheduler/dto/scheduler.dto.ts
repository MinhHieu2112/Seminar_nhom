import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsHexColor,
  IsNumber,
  IsIn,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

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

export class SessionDataDto {
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;
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
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['TASK', 'SESSION'])
  type?: 'TASK' | 'SESSION';

  @ValidateIf((o) => o.type === 'SESSION')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SessionDataDto)
  sessionData?: SessionDataDto;
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
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['TASK', 'SESSION'])
  type?: 'TASK' | 'SESSION';

  @ValidateIf((o) => o.type === 'SESSION')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SessionDataDto)
  sessionData?: SessionDataDto;
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
