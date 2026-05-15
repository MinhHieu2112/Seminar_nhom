export class TimeDistributionDto {
  morning!: number;
  afternoon!: number;
  evening!: number;
}

export class TaskStatsDto {
  total!: number;
  completed!: number;
  pending!: number;
  overdue!: number;
}

export class AnalyticsSummaryDto {
  totalGoals!: number;
  activeGoals!: number;
  completedGoals!: number;
  individualTasks!: TaskStatsDto;
  teamTasks!: TaskStatsDto;
  plannedBlocks!: number;
  completedBlocks!: number;
  totalStudyMins!: number;
}

export class TeamworkStatsDto {
  pendingInvitations!: number;
  activeGroupTasks!: number;
  collaboratorsCount!: number;
  waitingResponseTasks!: number;
}

export class NextDeadlineDto {
  title!: string;
  dueTime!: string;
  priority!: number;
}

export class WeeklyOverviewDto {
  scheduledBlocks!: number;
  studyHours!: number;
  completedTasks!: number;
}

export class AnalyticsDashboardResponseDto {
  completionRate!: number;
  productivityScore!: number;
  timeDistribution!: TimeDistributionDto;
  suggestions!: string[];
  summary!: AnalyticsSummaryDto;
  weeklyOverview!: WeeklyOverviewDto;
  teamwork!: TeamworkStatsDto;
  nextDeadline?: NextDeadlineDto;
}

export class StudyInsightsResponseDto {
  isOverloaded!: boolean;
  message!: string;
  recommendations!: string[];
}
