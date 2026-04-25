export class TimeDistributionDto {
  morning: number;
  afternoon: number;
  evening: number;
}

export class AnalyticsDashboardResponseDto {
  completionRate: number;
  productivityScore: number;
  timeDistribution: TimeDistributionDto;
  suggestions: string[];
}

export class StudyInsightsResponseDto {
  isOverloaded: boolean;
  message: string;
  recommendations: string[];
}
