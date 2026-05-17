import React from 'react';
import { ChatArea } from './ChatArea';
import type { GroupMember, Task } from '@/types/api';

interface ChatTabProps {
  groupId: string;
  groupName: string;
  groupMembers: (GroupMember & {
    user?: {
      id: string;
      name: string | null;
      avatar: string | null;
    } | null;
  })[];
  tasks: Task[]; // Retain in props to ensure full backward compatibility in parents
}

export function ChatTab({ groupId, groupName, groupMembers }: ChatTabProps) {
  const activeChannel = {
    id: 'general',
    title: 'Thảo luận chung',
    type: 'general' as const,
  };

  return (
    <ChatArea
      groupId={groupId}
      groupName={groupName}
      groupMembers={groupMembers}
      activeChannel={activeChannel}
    />
  );
}
