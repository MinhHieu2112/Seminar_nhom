export interface ScheduledBlockDto {
  id: string;
  taskId: string;
  taskTitle: string;
  plannedStart: Date;
  plannedEnd: Date;
  pomodoroIndex: number;
  status: string;
}

export interface ScheduleResultDto {
  success: boolean;
  scheduled: ScheduledBlockDto[];
  overflow: string[];
  message: string;
}
