export class CompletionCalculator {
  /**
   * Tính tỷ lệ hoàn thành (Completion Rate)
   * @param planned Tổng số task/block đã lên kế hoạch
   * @param actual Tổng số task/block đã thực sự hoàn thành
   * @returns Tỷ lệ phần trăm (0 - 100)
   */
  static calculateRate(planned: number, actual: number): number {
    if (planned === 0) return 0;
    if (actual >= planned) return 100;
    return Math.round((actual / planned) * 100);
  }
}
