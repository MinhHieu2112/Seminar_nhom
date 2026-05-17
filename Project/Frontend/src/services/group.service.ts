import { apiClient } from '@/lib/api-client';
import type { Group, CreateGroupDto, AddMemberDto, GroupInvitation } from '@/types/api';

export const groupService = {
  getGroups: () =>
    apiClient.get<{ success: boolean; data: Group[] }>('/api/v1/teamwork/groups'),

  getGroupDetails: (id: string) =>
    apiClient.get<{ success: boolean; data: Group }>(`/api/v1/teamwork/groups/${id}`),

  createGroup: (data: CreateGroupDto) =>
    apiClient.post<{ success: boolean; data: Group }>('/api/v1/teamwork/groups', data),

  inviteMember: (groupId: string, data: AddMemberDto) =>
    apiClient.post<{ success: boolean; data: Group }>(`/api/v1/teamwork/groups/${groupId}/invitations`, data),

  getInvitations: () =>
    apiClient.get<{ success: boolean; data: GroupInvitation[] }>('/api/v1/teamwork/groups/invitations/me'),

  respondToInvitation: (invitationId: string, accept: boolean) =>
    apiClient.post<{ success: boolean }>(`/api/v1/teamwork/groups/invitations/${invitationId}/respond`, { accept }),

  updateGroup: (groupId: string, data: Partial<CreateGroupDto>) =>
    apiClient.put<{ success: boolean; data: Group }>(`/api/v1/teamwork/groups/${groupId}`, data),

  deleteGroup: (groupId: string) =>
    apiClient.delete<{ success: boolean }>(`/api/v1/teamwork/groups/${groupId}`),

  removeMember: (groupId: string, targetUserId: string) =>
    apiClient.delete<{ success: boolean }>(`/api/v1/teamwork/groups/${groupId}/members/${targetUserId}`),
};
