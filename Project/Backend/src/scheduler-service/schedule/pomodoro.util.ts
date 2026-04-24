import dayjs from 'dayjs';

export interface PomodoroBlock {
  workStart: Date;
  workEnd: Date;
  breakStart?: Date;
  breakEnd?: Date;
  isLongBreak: boolean;
  index: number;
}

export interface PomodoroConfig {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakAfter: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakAfter: 4,
};

export function splitTaskToPomodoro(
  taskDurationMin: number,
  startTime: Date,
  config: Partial<PomodoroConfig> = {},
): PomodoroBlock[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const blocks: PomodoroBlock[] = [];

  let currentTime = dayjs(startTime);
  let remainingDuration = taskDurationMin;
  let pomodoroIndex = 1;

  while (remainingDuration > 0) {
    const workDuration = Math.min(cfg.workMin, remainingDuration);
    const workStart = currentTime.toDate();
    const workEnd = currentTime.add(workDuration, 'minute').toDate();

    remainingDuration -= workDuration;

    let breakStart: Date | undefined;
    let breakEnd: Date | undefined;
    let isLongBreak = false;

    if (remainingDuration > 0) {
      isLongBreak = pomodoroIndex % cfg.longBreakAfter === 0;
      const breakDuration = isLongBreak ? cfg.longBreakMin : cfg.shortBreakMin;
      breakStart = workEnd;
      breakEnd = dayjs(workEnd).add(breakDuration, 'minute').toDate();
      currentTime = dayjs(breakEnd);
    }

    blocks.push({
      workStart,
      workEnd,
      breakStart,
      breakEnd,
      isLongBreak,
      index: pomodoroIndex,
    });

    if (remainingDuration <= 0) {
      break;
    }

    pomodoroIndex++;
  }

  return blocks;
}

export function calculateTotalDurationWithBreaks(
  taskDurationMin: number,
  config: Partial<PomodoroConfig> = {},
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const fullPomodoros = Math.ceil(taskDurationMin / cfg.workMin);
  const longBreaks = Math.floor((fullPomodoros - 1) / cfg.longBreakAfter);
  const shortBreaks = fullPomodoros - 1 - longBreaks;

  return (
    taskDurationMin +
    shortBreaks * cfg.shortBreakMin +
    longBreaks * cfg.longBreakMin
  );
}

export function getEffectiveConfig(): PomodoroConfig {
  return {
    workMin: parseInt(process.env.POMODORO_WORK_MIN ?? '25', 10),
    shortBreakMin: parseInt(process.env.POMODORO_SHORT_BREAK_MIN ?? '5', 10),
    longBreakMin: parseInt(process.env.POMODORO_LONG_BREAK_MIN ?? '15', 10),
    longBreakAfter: parseInt(process.env.POMODORO_LONG_BREAK_AFTER ?? '4', 10),
  };
}
