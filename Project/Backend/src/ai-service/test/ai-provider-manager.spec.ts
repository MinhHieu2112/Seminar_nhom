// Kiểm thử Unit cho AiProviderManager (quản lý các mô hình AI khác nhau như Gemini, OpenAI)
import { Test, TestingModule } from '@nestjs/testing';
import { AiProviderManager } from '../providers/ai-provider-manager.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { OpenAIProvider } from '../providers/openai.provider';
import { PromptContext } from '../interfaces/ai-provider.interface';
import { AiScheduleOutput } from '../dto/ai-schema.dto';

describe('AiProviderManager Cooldown and Fallback', () => {
  let manager: AiProviderManager;
  let mockGeminiProvider: jest.Mocked<GeminiProvider>;
  let mockOpenAIProvider: jest.Mocked<OpenAIProvider>;

  const mockContext: PromptContext = {
    today: '2026-05-19',
    nextWeek: '2026-05-26',
  };

  const mockSuccessOutput: AiScheduleOutput = {
    goalTitle: 'Lịch học thử',
    tasks: [],
    busySlots: [],
    fromDate: '2026-05-19',
    toDate: '2026-05-26',
    preferredTimes: ['morning'],
  };

  beforeEach(async () => {
    mockGeminiProvider = {
      name: 'Gemini',
      generateFromText: jest.fn(),
      generateFromImage: jest.fn(),
    } as any;

    mockOpenAIProvider = {
      name: 'OpenAI',
      generateFromText: jest.fn(),
      generateFromImage: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProviderManager,
        { provide: GeminiProvider, useValue: mockGeminiProvider },
        { provide: OpenAIProvider, useValue: mockOpenAIProvider },
      ],
    }).compile();

    manager = module.get<AiProviderManager>(AiProviderManager);
  });

  it('should be defined', () => {
    expect(manager).toBeDefined();
  });

  describe('generateFromTextWithFallback', () => {
    it('should successfully use Gemini first and not fall back if Gemini succeeds', async () => {
      mockGeminiProvider.generateFromText.mockResolvedValue(mockSuccessOutput);

      const result = await manager.generateFromTextWithFallback(
        'Học toán ngày mai',
        mockContext,
      );

      expect(result).toEqual(mockSuccessOutput);
      expect(mockGeminiProvider.generateFromText).toHaveBeenCalledTimes(1);
      expect(mockOpenAIProvider.generateFromText).not.toHaveBeenCalled();
    });

    it('should trigger OpenAI fallback and set cooldown if Gemini throws a quota error (429)', async () => {
      const quotaError = new Error('Quota Exceeded / Too many requests');
      (quotaError as any).status = 429;

      mockGeminiProvider.generateFromText.mockRejectedValue(quotaError);
      mockOpenAIProvider.generateFromText.mockResolvedValue(mockSuccessOutput);

      const result = await manager.generateFromTextWithFallback(
        'Học toán ngày mai',
        mockContext,
      );

      expect(result).toEqual(mockSuccessOutput);
      expect(mockGeminiProvider.generateFromText).toHaveBeenCalledTimes(1);
      expect(mockOpenAIProvider.generateFromText).toHaveBeenCalledTimes(1);

      // Verify cooldown is set by doing another call - it should bypass Gemini
      mockGeminiProvider.generateFromText.mockClear();
      mockOpenAIProvider.generateFromText.mockClear();

      const result2 = await manager.generateFromTextWithFallback(
        'Học toán ngày mai',
        mockContext,
      );
      expect(result2).toEqual(mockSuccessOutput);
      // Gemini should be bypassed entirely
      expect(mockGeminiProvider.generateFromText).not.toHaveBeenCalled();
      expect(mockOpenAIProvider.generateFromText).toHaveBeenCalledTimes(1);
    });

    it('should bypass Gemini during cooldown, then retry Gemini when cooldown expires', async () => {
      const quotaError = new Error('RESOURCE_EXHAUSTED');
      mockGeminiProvider.generateFromText.mockRejectedValue(quotaError);
      mockOpenAIProvider.generateFromText.mockResolvedValue(mockSuccessOutput);

      // First call - hits quota error, sets cooldown
      await manager.generateFromTextWithFallback('Học toán', mockContext);

      // Mock Date.now to simulate 6 minutes passing
      const originalNow = Date.now;
      const futureTime = Date.now() + 6 * 60 * 1000;
      global.Date.now = jest.fn(() => futureTime);

      mockGeminiProvider.generateFromText.mockClear();
      mockGeminiProvider.generateFromText.mockResolvedValue(mockSuccessOutput);
      mockOpenAIProvider.generateFromText.mockClear();

      // Second call - should retry Gemini because cooldown expired
      const result = await manager.generateFromTextWithFallback(
        'Học toán',
        mockContext,
      );
      expect(result).toEqual(mockSuccessOutput);
      expect(mockGeminiProvider.generateFromText).toHaveBeenCalledTimes(1);
      expect(mockOpenAIProvider.generateFromText).not.toHaveBeenCalled();

      // Restore Date.now
      global.Date.now = originalNow;
    });

    it('should fallback to local heuristic if both providers fail', async () => {
      mockGeminiProvider.generateFromText.mockRejectedValue(
        new Error('Gemini API is down'),
      );
      mockOpenAIProvider.generateFromText.mockRejectedValue(
        new Error('OpenAI API is down'),
      );

      const result = await manager.generateFromTextWithFallback(
        'Học toán từ 16h đến 18h',
        mockContext,
      );

      expect(result.goalTitle).toBe('Lịch học Toán');
      expect(result.tasks[0].title).toBe('Học Toán');
      expect(result.tasks[0].type).toBe('SESSION');
    });
  });
});
