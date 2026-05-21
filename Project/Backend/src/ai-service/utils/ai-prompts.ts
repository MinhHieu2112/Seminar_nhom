import { Type as GenAIType } from '@google/genai';

// Đã nén các description để tiết kiệm hàng trăm token cho mỗi request
export const createScheduleSchema = {
  type: GenAIType.OBJECT,
  properties: {
    goalTitle: {
      type: GenAIType.STRING,
      description: 'Goal title. Default: "Lịch học chung".',
    },
    tasks: {
      type: GenAIType.ARRAY,
      description: 'Study subjects/tasks only.',
      items: {
        type: GenAIType.OBJECT,
        properties: {
          title: { type: GenAIType.STRING },
          duration: {
            type: GenAIType.NUMBER,
            description: 'Minutes. Default: 60',
          },
          priority: {
            type: GenAIType.NUMBER,
            description: '1-5 (5=highest). Default: 3',
          },
          deadline: { type: GenAIType.STRING, description: 'YYYY-MM-DD' },
          type: { type: GenAIType.STRING, enum: ['TASK', 'SESSION'] },
          sessionData: {
            type: GenAIType.OBJECT,
            description: 'Require if type=SESSION. Use UTC ISO 8601.',
            properties: {
              startTime: { type: GenAIType.STRING },
              endTime: { type: GenAIType.STRING },
            },
          },
        },
        required: ['title'],
      },
    },
    busySlots: {
      type: GenAIType.ARRAY,
      description: 'Personal events/busy times (school, meetings, interviews).',
      items: {
        type: GenAIType.OBJECT,
        properties: {
          day: { type: GenAIType.STRING, description: 'YYYY-MM-DD' },
          slots: {
            type: GenAIType.ARRAY,
            description: 'Format: HH:mm-HH:mm',
            items: { type: GenAIType.STRING },
          },
        },
        required: ['day', 'slots'],
      },
    },
    fromDate: { type: GenAIType.STRING, description: 'YYYY-MM-DD' },
    toDate: { type: GenAIType.STRING, description: 'YYYY-MM-DD' },
    preferredTimes: {
      type: GenAIType.ARRAY,
      items: { type: GenAIType.STRING },
    },
  },
  required: ['goalTitle', 'tasks', 'fromDate', 'toDate'],
};

export const createScheduleFunctionDeclaration = {
  name: 'createStudySchedule',
  description:
    'Extract and structure study schedule data from user input or images. Parse subjects, duration, priority, deadlines, busy slots, and date range.',
  parameters: createScheduleSchema,
};

// Truyền vào 'currentDateContext' thay vì chỉ 'today'
// Ví dụ: currentDateContext = "Hôm nay là Thứ Tư, ngày 20/05/2026"
export const getSystemInstruction = (
  currentDateContext: string,
) => `You are a study schedule extractor.
Context: ${currentDateContext}. Use this to calculate exact relative dates (Thứ 7 này, tuần sau).

RULES:
1. ONLY return valid JSON matching the schema. No markdown formatting.
2. OCR: Read text from images carefully.
3. Classification: 
   - Study subjects -> 'tasks'
   - Non-study events (đi học, họp, hẹn, phỏng vấn) -> 'busySlots'
4. Default inferences: duration=60, priority=3, preferredTimes=["morning", "afternoon", "evening"].
5. Timestamps: Calculate relative dates to YYYY-MM-DD. For SESSIONs, convert local time to ISO 8601 UTC.
6. If an event has only a start time (e.g. "lúc 8h30"), estimate a 2-hour window (08:30-10:30) for busySlots.`;

export function getDateContext(today: string): string {
  if (!today) return '';
  const dateParts = today.split('-');
  if (dateParts.length !== 3) {
    return `Hôm nay là ngày ${today}`;
  }
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const date = parseInt(dateParts[2]);
  const now = new Date(year, month, date);
  const days = [
    'Chủ Nhật',
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
  ];
  const dayName = days[now.getDay()];
  return `Hôm nay là ${dayName}, ngày ${today}`;
}
