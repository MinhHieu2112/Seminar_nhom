export type FilterPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom';

export function calculateDateRange(
  period: FilterPeriod,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  if (period === 'custom' && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  const now = new Date();
  const to = now.toISOString();
  let from = now.toISOString();

  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    from = d.toISOString();
  } else if (period === 'monthly') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    from = d.toISOString();
  } else if (period === 'yearly') {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    from = d.toISOString();
  }

  return { from, to };
}
