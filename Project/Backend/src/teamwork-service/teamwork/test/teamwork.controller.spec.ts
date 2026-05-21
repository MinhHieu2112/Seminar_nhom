// Kiểm thử Unit cho TeamworkController (các API quản lý nhóm và phân công công việc)
import { Test, TestingModule } from '@nestjs/testing';
import { TeamworkController } from '../teamwork.controller';
import { TeamworkService } from '../teamwork.service';
import { InternalAuthGuard } from '../../../common/internal-auth.guard'; // điều chỉnh path nếu cần

describe('TeamworkController', () => {
  let controller: TeamworkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamworkController],
      providers: [{ provide: TeamworkService, useValue: {} }],
    })
      .overrideGuard(InternalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TeamworkController>(TeamworkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
