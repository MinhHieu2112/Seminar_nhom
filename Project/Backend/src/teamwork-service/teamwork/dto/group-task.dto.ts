import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateGroupTaskDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

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
  @IsNumber()
  priority?: number;
}

export class UpdateGroupTaskDto {
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
  assigneeId?: string | null;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  leaderComments?: string | null;
}

export class CreateGroupTaskAllocationDto {
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
