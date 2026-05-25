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
      description: 'Study subjects/tasks only.',
      type: GenAIType.ARRAY,
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
          category: {
            type: GenAIType.STRING,
            description:
              'Category name (e.g. "Học tập", "Giải trí", "Làm việc", "Cá nhân"). Try to match one of userCategories if provided.',
          },
          confidence: {
            type: GenAIType.NUMBER,
            description:
              'Confidence of classification (0.0 to 1.0). If you guess or estimate, set a low value like 0.6.',
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
  userCategories?: string[],
) => {
  const categoriesList =
    userCategories && userCategories.length > 0
      ? `Available database categories: ${userCategories.map((c) => `"${c}"`).join(', ')}.`
      : 'Available database categories: "Học tập", "Làm việc", "Giải trí", "Cá nhân".';

  return `You are a study schedule extractor.
Context: ${currentDateContext}. Use this to calculate exact relative dates (Thứ 7 này, tuần sau).
${categoriesList}

RULES:
1. ONLY return valid JSON matching the schema. No markdown formatting.
2. OCR: Read text from images carefully.
3. Classification (CRITICAL - DO NOT CLASSIFY LEISURE/SOCIAL EVENTS AS STUDY):
   - Academic study, classes, homework, exams, studying subjects -> Classify category as "Học tập" (or similar matched category).
   - Work, job, project, business -> Classify category as "Làm việc".
   - Hanging out, dining, meetings with friends, movies, games, dating (e.g., "có hẹn với bạn", "đi nhậu", "đi xem phim") -> Classify category as "Giải trí" (or similar matched category).
   - Personal errands, health, fitness, chores -> Classify category as "Cá nhân".
   - Try to match one of the available database categories. If none match, output the most suitable category.
4. Confidence score:
   - Output confidence score (0.0 to 1.0) under the 'confidence' field.
   - If the task description is ambiguous, or there is uncertainty about the time, or the category is a guess, set a lower confidence score (e.g. 0.5 to 0.7).
   - If the task is clear, set a high confidence score (e.g. 0.85 to 1.0).
5. Default inferences: duration=60, priority=3, preferredTimes=["morning", "afternoon", "evening"].
6. Timestamps: Calculate relative dates to YYYY-MM-DD. For SESSIONs, convert local time to ISO 8601 UTC.
7. If an event has only a start time (e.g. "lúc 8h30"), estimate a 2-hour window (08:30-10:30) for busySlots.`;
};

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
