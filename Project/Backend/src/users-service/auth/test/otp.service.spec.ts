import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from '../otp.service';

const redisMock = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => redisMock);
});

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpService],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate a 6 digit otp and store it in redis', async () => {
      redisMock.set.mockResolvedValue('OK');

      const otp = await service.generateOtp('test@mail.com');

      expect(otp).toHaveLength(6);
      expect(redisMock.set).toHaveBeenCalledWith(
        'otp:test@mail.com',
        otp,
        'EX',
        300,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should return true and delete key if otp matches', async () => {
      redisMock.get.mockResolvedValue('123456');
      redisMock.del.mockResolvedValue(1);

      const result = await service.verifyOtp('test@mail.com', '123456', true);

      expect(result).toBe(true);
      expect(redisMock.get).toHaveBeenCalledWith('otp:test@mail.com');
      expect(redisMock.del).toHaveBeenCalledWith('otp:test@mail.com');
    });

    it('should return false if otp does not match', async () => {
      redisMock.get.mockResolvedValue('123456');

      const result = await service.verifyOtp('test@mail.com', 'wrong', true);

      expect(result).toBe(false);
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });
});
