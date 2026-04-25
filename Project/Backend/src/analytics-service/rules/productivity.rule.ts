export class ProductivityRule {
  /**
   * Tính điểm năng suất dựa trên tỷ lệ hoàn thành, điểm tập trung trung bình và chuỗi ngày học.
   * @param completionRate Tỷ lệ hoàn thành (0 - 100)
   * @param avgFocusScore Điểm tập trung trung bình (1 - 5)
   * @param streakDays Chuỗi ngày học liên tiếp
   * @returns Điểm năng suất (0 - 100)
   */
  static calculateScore(
    completionRate: number,
    avgFocusScore: number,
    streakDays: number,
  ): number {
    // Trọng số: 50% từ Completion Rate, 30% từ Focus Score, 20% từ Streak
    const rateScore = completionRate * 0.5;
    
    // Focus score 1-5 -> scale lên 100
    const focusScore = (avgFocusScore / 5) * 100 * 0.3;
    
    // Streak: mỗi ngày 2 điểm, tối đa 20 điểm (10 ngày)
    const streakScore = Math.min(streakDays * 2, 20);

    let totalScore = Math.round(rateScore + focusScore + streakScore);
    return Math.min(totalScore, 100);
  }
}
