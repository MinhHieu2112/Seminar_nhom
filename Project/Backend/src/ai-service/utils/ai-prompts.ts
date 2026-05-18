import { Type as GenAIType } from '@google/genai';

export const createScheduleFunctionDeclaration = {
  name: 'createStudySchedule',
  description:
    'Extract and structure study schedule data from user input or images. Parse subjects, duration, priority, deadlines, busy times, and date range into structured JSON.',
  parameters: {
    type: GenAIType.OBJECT,
    properties: {
      goalTitle: {
        type: GenAIType.STRING,
        description:
          'A descriptive title for this study plan (e.g. "Lịch ôn thi cuối kỳ", "Study plan for Math"). Default to "Lịch học chung".',
      },
      tasks: {
        type: GenAIType.ARRAY,
        description: 'List of study tasks/subjects to schedule.',
        items: {
          type: GenAIType.OBJECT,
          properties: {
            title: {
              type: GenAIType.STRING,
              description: 'Name of the subject or study task.',
            },
            duration: {
              type: GenAIType.NUMBER,
              description:
                'Study duration in minutes per day (15-480). Default 60.',
            },
            priority: {
              type: GenAIType.NUMBER,
              description:
                'Priority level from 1 (lowest) to 5 (highest). Default 3. Hints: "quan trọng" -> 5.',
            },
            deadline: {
              type: GenAIType.STRING,
              description:
                'Exam or deadline date in YYYY-MM-DD format. Optional.',
            },
            type: {
              type: GenAIType.STRING,
              description:
                'Whether this is a standard task ("TASK") or a specific study session ("SESSION") with exact time range (e.g. from 16:00 to 18:00). Defaults to "TASK".',
              enum: ['TASK', 'SESSION'],
            },
            sessionData: {
              type: GenAIType.OBJECT,
              description:
                'Required ONLY if type is "SESSION". Object containing startTime and endTime in ISO 8601 format.',
              properties: {
                startTime: {
                  type: GenAIType.STRING,
                  description:
                    'The start date and time of the study session in ISO 8601 format (UTC), e.g. "2026-05-19T09:00:00.000Z" (which is 16:00 UTC+7). Use correct timezone relative to today.',
                },
                endTime: {
                  type: GenAIType.STRING,
                  description:
                    'The end date and time of the study session in ISO 8601 format (UTC), e.g. "2026-05-19T11:00:00.000Z" (which is 18:00 UTC+7). Use correct timezone relative to today.',
                },
              },
            },
          },
          required: ['title'],
        },
      },
      busySlots: {
        type: GenAIType.ARRAY,
        description: 'Time slots when the user is busy and cannot study.',
        items: {
          type: GenAIType.OBJECT,
          properties: {
            day: {
              type: GenAIType.STRING,
              description: 'Date in YYYY-MM-DD format.',
            },
            slots: {
              type: GenAIType.ARRAY,
              description: 'Busy time ranges in HH:mm-HH:mm format.',
              items: { type: GenAIType.STRING },
            },
          },
          required: ['day', 'slots'],
        },
      },
      fromDate: {
        type: GenAIType.STRING,
        description:
          'Start date of the schedule range in YYYY-MM-DD format. If not specified by user, use today.',
      },
      toDate: {
        type: GenAIType.STRING,
        description:
          'End date of the schedule range in YYYY-MM-DD format. If not specified by user, use 7 days from today.',
      },
      preferredTimes: {
        type: GenAIType.ARRAY,
        description:
          'Preferred study time periods: "morning" (06:00-10:00), "afternoon" (10:00-16:00), "evening" (16:00-22:00). Default to all three.',
        items: { type: GenAIType.STRING },
      },
    },
    required: ['goalTitle', 'tasks', 'fromDate', 'toDate'],
  },
};

export const getSystemInstruction = (
  today: string,
  nextWeek: string,
) => `You are a smart study schedule assistant. Your job is to analyze the user's request (text or image) and extract structured study schedule data.

RULES:
- Always call the "createStudySchedule" function with extracted data. Never answer with plain text.
- If processing an image, read the text on the schedule/bill/note and extract the tasks and deadlines.
- Parse Vietnamese and English equally well.
- If the user mentions subjects, extract each as a separate task.
- Infer reasonable defaults: duration = 60 min, priority = 3, preferredTimes = all three.
- Today's date is ${today}. If dates are unspecified, use fromDate = ${today} and toDate = ${nextWeek}.
- For deadlines like "thi ngày 20/5", convert to YYYY-MM-DD format based on the current year.
- For relative dates like "tuần sau", "3 ngày nữa", compute the actual date relative to today.
- If user mentions busy time like "thứ 2 bận 8h-10h", convert to proper busySlots format.
- Priority hints: "quan trọng", "ưu tiên cao" → 5; "bình thường" → 3; "ít quan trọng" → 1.
- Identify whether each study task is a standard task ("TASK") or a specific scheduled study session ("SESSION").
- If the user specifies a particular time slot for studying (e.g. "học toán từ 16h đến 18h ngày mai", "học Văn lúc 8:30 đến 10:00 sáng chủ nhật"), set type = "SESSION", and generate sessionData with startTime and endTime in ISO 8601 format using the correct date based on today (${today}). Adjust to UTC time or include offset.
- If no specific time slot is mentioned (e.g. "lên lịch học Toán 2 tiếng"), set type = "TASK" and do not include sessionData.`;
