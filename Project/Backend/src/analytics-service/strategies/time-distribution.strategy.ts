import { TimeDistributionDto } from '../dto/analytics-response.dto';

export class TimeDistributionStrategy {
  /**
   * Phân bổ thời gian học thành các buổi: Sáng, Chiều, Tối
   * Đầu vào là danh sách các session với thời gian bắt đầu (Date) và thời lượng (minutes)
   */
  static analyze(sessions: Array<{ startTime: Date; durationMin: number }>): TimeDistributionDto {
    let morningMin = 0;   // 06:00 - 11:59
    let afternoonMin = 0; // 12:00 - 17:59
    let eveningMin = 0;   // 18:00 - 23:59 (and 00:00 - 05:59)

    for (const session of sessions) {
      const hour = session.startTime.getHours();
      
      if (hour >= 6 && hour < 12) {
        morningMin += session.durationMin;
      } else if (hour >= 12 && hour < 18) {
        afternoonMin += session.durationMin;
      } else {
        eveningMin += session.durationMin;
      }
    }

    const totalMin = morningMin + afternoonMin + eveningMin;
    if (totalMin === 0) {
      return { morning: 0, afternoon: 0, evening: 0 };
    }

    return {
      morning: Math.round((morningMin / totalMin) * 100),
      afternoon: Math.round((afternoonMin / totalMin) * 100),
      evening: Math.round((eveningMin / totalMin) * 100),
    };
  }

  /**
   * Đưa ra gợi ý lịch học dựa trên phân bổ thời gian hiện tại
   */
  static generateSuggestions(distribution: TimeDistributionDto): string[] {
    const suggestions: string[] = [];

    // Tìm buổi học nhiều nhất
    let peakTime = 'sáng';
    let maxPct = distribution.morning;

    if (distribution.afternoon > maxPct) {
      peakTime = 'chiều';
      maxPct = distribution.afternoon;
    }
    if (distribution.evening > maxPct) {
      peakTime = 'tối';
      maxPct = distribution.evening;
    }

    if (maxPct > 0) {
      suggestions.push(`Bạn có xu hướng tập trung tốt nhất vào buổi ${peakTime}. Hãy sắp xếp các task khó hoặc quan trọng vào thời gian này.`);
    }

    // Cảnh báo nếu học buổi tối quá nhiều
    if (distribution.evening > 50) {
      suggestions.push('Bạn đang học khá nhiều vào buổi tối muộn. Hãy cố gắng chuyển bớt sang buổi sáng để đảm bảo chất lượng giấc ngủ.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Hãy bắt đầu ghi nhận thời gian học (actual sessions) để nhận được các gợi ý lịch học phù hợp.');
    }

    return suggestions;
  }
}
