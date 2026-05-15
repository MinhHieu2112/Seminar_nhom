import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/services/group.service';
import type { CreateGroupDto, UpdateGroupDto, AddMemberDto } from '@/types/api';

function unwrapResponse<T>(payload: T | { data?: T } | undefined | null): T | null {
  if (!payload) return null;
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data?: T }).data ?? null;
  }
  return payload as T;
}

export function useGetGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await groupService.getGroups();
      const groups = unwrapResponse(res.data);
      return Array.isArray(groups) ? groups : [];
    },
  });
}

export function useGetGroupDetails(groupId: string) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const res = await groupService.getGroupDetails(groupId);
      return unwrapResponse(res.data);
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupDto) => {
      const res = await groupService.createGroup(data);
      return unwrapResponse(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useInviteGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: AddMemberDto }) => {
      const res = await groupService.inviteMember(groupId, data);
      return unwrapResponse(res.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}

export function useGetInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await groupService.getInvitations();
      return unwrapResponse(res.data) || [];
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, accept }: { invitationId: string; accept: boolean }) => {
      const res = await groupService.respondToInvitation(invitationId, accept);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: UpdateGroupDto }) => {
      const res = await groupService.updateGroup(groupId, data);
      return unwrapResponse(res.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, targetUserId }: { groupId: string; targetUserId: string }) => {
      const res = await groupService.removeMember(groupId, targetUserId);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const res = await groupService.deleteGroup(groupId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
