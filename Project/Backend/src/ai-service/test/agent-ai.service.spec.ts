import { Test, TestingModule } from '@nestjs/testing';
import { AgentAiService } from '../agent-ai.service';
import { AiScheduleOutputSchema } from '../dto/ai-schema.dto';

describe('AgentAiService', () => {
  let service: AgentAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentAiService],
    }).compile();

    service = module.get<AgentAiService>(AgentAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('AiScheduleOutputSchema Validation', () => {
    it('should validate a valid TASK schedule payload', () => {
      const validPayload = {
        goalTitle: 'Lịch ôn thi cuối kỳ',
        fromDate: '2026-05-19',
        toDate: '2026-05-26',
        preferredTimes: ['morning', 'evening'],
        tasks: [
          {
            title: 'Học Toán cao cấp',
            duration: 120,
            priority: 4,
            deadline: '2026-05-25',
            type: 'TASK',
          },
        ],
        busySlots: [],
      };

      const result = AiScheduleOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tasks[0].type).toBe('TASK');
      }
    });

    it('should validate a valid SESSION schedule payload', () => {
      const validPayload = {
        goalTitle: 'Lập lịch phiên học',
        fromDate: '2026-05-19',
        toDate: '2026-05-26',
        preferredTimes: ['afternoon'],
        tasks: [
          {
            title: 'Học lập trình NestJS',
            duration: 120,
            priority: 5,
            type: 'SESSION',
            sessionData: {
              startTime: '2026-05-20T09:00:00.000Z',
              endTime: '2026-05-20T11:00:00.000Z',
            },
          },
        ],
        busySlots: [],
      };

      const result = AiScheduleOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tasks[0].type).toBe('SESSION');
        expect(result.data.tasks[0].sessionData?.startTime).toBe(
          '2026-05-20T09:00:00.000Z',
        );
      }
    });

    it('should fail validation with invalid task type', () => {
      const invalidPayload = {
        goalTitle: 'Lịch ôn thi',
        fromDate: '2026-05-19',
        toDate: '2026-05-26',
        tasks: [
          {
            title: 'Học Toán',
            type: 'INVALID_TYPE',
          },
        ],
      };

      const result = AiScheduleOutputSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });
});
