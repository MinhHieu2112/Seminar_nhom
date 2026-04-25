export class UnifiedTaskDto {
  id?: string;
  title!: string;
  duration!: number;
  priority!: number;
  deadline?: string;
}

export class TimeSlotDto {
  day!: string;
  slots!: string[];
}

export class UnifiedConstraintsDto {
  availableTime!: TimeSlotDto[];
  busyTime!: TimeSlotDto[];
}

export class UnifiedInputDto {
  tasks!: UnifiedTaskDto[];
  constraints!: UnifiedConstraintsDto;
}

export class NormalizeInputDto {
  userId!: string;
  type!: 'manual' | 'csv';
  data!: string; // JSON string or CSV raw string
}
