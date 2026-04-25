export type SessionType = 'morning' | 'afternoon' | 'evening';

export interface FreeSlotDto {
  start: Date;
  end: Date;
  durationMin: number;
  sessionType: SessionType;
}
