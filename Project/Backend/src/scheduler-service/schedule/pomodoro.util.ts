export interface PomodoroConfig {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakAfter: number;
}

export function getEffectiveConfig(): PomodoroConfig {
  return {
    workMin: parseInt(process.env.POMODORO_WORK_MIN ?? '25', 10),
    shortBreakMin: parseInt(process.env.POMODORO_SHORT_BREAK_MIN ?? '5', 10),
    longBreakMin: parseInt(process.env.POMODORO_LONG_BREAK_MIN ?? '15', 10),
    longBreakAfter: parseInt(process.env.POMODORO_LONG_BREAK_AFTER ?? '4', 10),
  };
}
