import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupGuard } from './guards/group.guard';

describe('GroupsController', () => {
  let controller: GroupsController;

  const serviceMock = {
    createGroup: jest.fn(),
    getGroups: jest.fn(),
    updateGroup: jest.fn(),
    getGroupDetails: jest.fn(),
    inviteMember: jest.fn(),
    getInvitations: jest.fn(),
    respondToInvitation: jest.fn(),
    removeMember: jest.fn(),
    deleteGroup: jest.fn(),
  };

  const mockGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: serviceMock }],
    })
      .overrideGuard(GroupGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<GroupsController>(GroupsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createGroup should call service', async () => {
    const dto = { name: 'Group' };
    await controller.createGroup('u1', dto);
    expect(serviceMock.createGroup).toHaveBeenCalledWith('u1', dto);
  });

  it('getGroups should call service', async () => {
    await controller.getGroups('u1');
    expect(serviceMock.getGroups).toHaveBeenCalledWith('u1');
  });

  it('updateGroup should call service', async () => {
    const dto = { name: 'Updated' };
    await controller.updateGroup('u1', 'g1', dto);
    expect(serviceMock.updateGroup).toHaveBeenCalledWith('u1', 'g1', dto);
  });

  it('inviteMember should call service', async () => {
    const dto = { userId: 'u2' };
    await controller.inviteMember('u1', 'g1', dto);
    expect(serviceMock.inviteMember).toHaveBeenCalledWith('u1', 'g1', dto);
  });

  it('respondToInvitation should call service', async () => {
    await controller.respondToInvitation('u1', 'i1', true);
    expect(serviceMock.respondToInvitation).toHaveBeenCalledWith(
      'u1',
      'i1',
      true,
    );
  });

  it('removeMember should call service', async () => {
    await controller.removeMember('u1', 'g1', 'u2');
    expect(serviceMock.removeMember).toHaveBeenCalledWith('u1', 'g1', 'u2');
  });

  it('deleteGroup should call service', async () => {
    await controller.deleteGroup('u1', 'g1');
    expect(serviceMock.deleteGroup).toHaveBeenCalledWith('u1', 'g1');
  });
});
