export class TimeDistributionDto {
  morning!: number;
  afternoon!: number;
  evening!: number;
}

export class AnalyticsSummaryDto {
  totalGoals!: number;
  activeGoals!: number;
  completedGoals!: number;
  totalTasks!: number;
  pendingTasks!: number;
  completedTasks!: number;
  overdueTasks!: number;
  plannedBlocks!: number;
  completedBlocks!: number;
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
}

export class StudyInsightsResponseDto {
  isOverloaded!: boolean;
  message!: string;
  recommendations!: string[];
}
