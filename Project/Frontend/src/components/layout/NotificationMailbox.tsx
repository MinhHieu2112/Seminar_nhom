'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Envelope, Bell, ChatCircle, Spinner, UserPlus, Warning, Clock } from '@phosphor-icons/react';
import { useGetInvitations, useRespondToInvitation } from '@/hooks/useGroups';
import { useGetNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import type { GroupInvitation, Notification as NotificationType } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { useQueryClient } from '@tanstack/react-query';

export function NotificationMailbox() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'invitations' | 'notifications'>('invitations');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: invitations = [], isLoading: isLoadingInv } = useGetInvitations();
  const respondMutation = useRespondToInvitation();

  const { data: notifications = [], isLoading: isLoadingNotif } = useGetNotifications();
  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  const pendingInvCount = invitations.length;
  const unreadNotifCount = notifications.filter(n => n.status === 'unread').length;

  const { user: currentUser, accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser || !accessToken) return;

    // Connect to the API Gateway WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_TEAMWORK_WS_URL || 'http://localhost:8000';
    const socket = io(wsUrl, {
      auth: { token: accessToken },
      query: { userId: currentUser.id },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[NotificationMailbox] Realtime notification socket connected successfully!');
    });

    socket.on('notificationRead', (data: { id: string }) => {
      console.log('[NotificationMailbox] Received notificationRead event:', data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('notificationReadAll', () => {
      console.log('[NotificationMailbox] Received notificationReadAll event');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('notificationCreated', () => {
      console.log('[NotificationMailbox] Received notificationCreated event');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('invitationReceived', (data: { groupId: string; inviterId: string }) => {
      console.log('[NotificationMailbox] Received invitationReceived event:', data);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('invitationAccepted', (data: { groupId: string }) => {
      console.log('[NotificationMailbox] Received invitationAccepted event:', data);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    });

    socket.on('memberRemoved', (data: { groupId: string }) => {
      console.log('[NotificationMailbox] Received memberRemoved event:', data);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      if (pathname === `/scheduler/teamwork/${data.groupId}`) {
        router.push('/scheduler');
      }
    });

    socket.on('memberJoined', (data: { groupId: string; userId: string }) => {
      console.log('[NotificationMailbox] Received memberJoined event:', data);
      queryClient.invalidateQueries({ queryKey: ['groups', data.groupId] });
    });

    socket.on('memberLeft', (data: { groupId: string; userId: string }) => {
      console.log('[NotificationMailbox] Received memberLeft event:', data);
      queryClient.invalidateQueries({ queryKey: ['groups', data.groupId] });
    });

    socket.on('groupUpdated', (data: { groupId: string }) => {
      console.log('[NotificationMailbox] Received groupUpdated event:', data);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', data.groupId] });
    });

    socket.on('groupDeleted', (data: { groupId: string }) => {
      console.log('[NotificationMailbox] Received groupDeleted event:', data);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      if (pathname === `/scheduler/teamwork/${data.groupId}`) {
        router.push('/scheduler');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, accessToken, queryClient, pathname, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResponse = async (invitationId: string, accept: boolean) => {
    try {
      await respondMutation.mutateAsync({ invitationId, accept });
    } catch (err) {
      console.error('Failed to respond to invitation:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleOpenNotification = async (notif: NotificationType) => {
    try {
      if (notif.status === 'unread') {
        await markReadMutation.mutateAsync(notif.id);
      }

      if (notif.task?.groupId) {
        router.push(`/scheduler/teamwork/${notif.task.groupId}?taskId=${notif.task.id}`);
      }
    } catch (err) {
      console.error('Failed to open notification:', err);
    } finally {
      setIsOpen(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveTab(pendingInvCount > 0 ? 'invitations' : 'notifications');
    }
  };

  const totalUnread = pendingInvCount + unreadNotifCount;

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      {/* Icons */}
      <div className="flex items-center gap-1">
        <button 
          onClick={toggleOpen}
          className={`p-2 rounded-full transition-all relative ${
            isOpen ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <Bell size={20} weight="bold" />
          {totalUnread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-gray-50 flex flex-col gap-3 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Thông báo
                {totalUnread > 0 && <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black">{totalUnread} mới</span>}
              </h3>
              {activeTab === 'notifications' && unreadNotifCount > 0 && (
                <button 
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                Tin nhắn ({unreadNotifCount})
              </button>
              <button 
                onClick={() => setActiveTab('invitations')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'invitations' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                Lời mời ({pendingInvCount})
              </button>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {activeTab === 'invitations' ? (
              isLoadingInv ? (
                <div className="flex flex-col items-center py-10">
                  <Spinner size={32} className="animate-spin text-indigo-600" />
                  <p className="text-xs text-gray-400 mt-2 font-medium">Đang tải...</p>
                </div>
              ) : invitations.length === 0 ? (
                <EmptyState icon={<Envelope size={32} />} title="Không có lời mời" subtitle="Khi có ai đó mời bạn vào nhóm, lời mời sẽ xuất hiện ở đây." />
              ) : (
                <div className="divide-y divide-gray-50">
                  {invitations.map((inv: GroupInvitation) => (
                    <InvitationItem key={inv.id} inv={inv} onResponse={handleResponse} isPending={respondMutation.isPending} />
                  ))}
                </div>
              )
            ) : (
              isLoadingNotif ? (
                <div className="flex flex-col items-center py-10">
                  <Spinner size={32} className="animate-spin text-indigo-600" />
                  <p className="text-xs text-gray-400 mt-2 font-medium">Đang tải...</p>
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState icon={<Bell size={32} />} title="Chưa có thông báo" subtitle="Các nhắc nhở về lịch học và công việc sẽ hiển thị tại đây." />
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif: NotificationType) => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onMarkRead={handleMarkRead}
                      onOpen={handleOpenNotification}
                    />
                  ))}
                </div>
              )
            )}
          </div>

          <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
            <button className="text-[11px] font-bold text-gray-500 hover:text-gray-700">Xem tất cả</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="flex flex-col items-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
        {icon}
      </div>
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function InvitationItem({ inv, onResponse, isPending }: { inv: GroupInvitation, onResponse: (id: string, accept: boolean) => void, isPending: boolean }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors group">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <UserPlus size={20} weight="bold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">Lời mời tham gia nhóm</p>
            <span className="text-[10px] text-gray-400">
              {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true, locale: vi })}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900 mb-2 truncate">
            {inv.group?.name || 'Nhóm mới'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => onResponse(inv.id, true)} disabled={isPending} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg transition-all shadow-sm">XÁC NHẬN</button>
            <button onClick={() => onResponse(inv.id, false)} disabled={isPending} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black rounded-lg transition-all">TỪ CHỐI</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notif,
  onMarkRead,
  onOpen,
}: {
  notif: NotificationType;
  onMarkRead: (id: string) => void;
  onOpen: (notif: NotificationType) => void;
}) {
  const isUrgent = notif.title.includes('🔴 Gấp');
  const isWarning = notif.title.includes('⚠️ Nhắc nhở');
  const canOpenTask = Boolean(notif.task?.groupId);

  return (
    <div 
      className={`p-4 transition-colors group relative ${
        notif.status === 'unread' ? 'bg-blue-50/30' : 'hover:bg-gray-50'
      } ${canOpenTask ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (canOpenTask) {
          onOpen(notif);
          return;
        }

        if (notif.status === 'unread') {
          onMarkRead(notif.id);
        }
      }}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
          isUrgent ? 'bg-red-100 text-red-600' : isWarning ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {isUrgent ? <Warning size={20} weight="fill" /> : isWarning ? <Clock size={20} weight="fill" /> : <Bell size={20} weight="fill" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`text-[10px] font-black uppercase tracking-wider ${
              isUrgent ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'
            }`}>
              {notif.type}
            </p>
            <span className="text-[10px] text-gray-400">
              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1 leading-tight">
            {notif.title}
          </p>
          <p className="text-xs text-gray-500 line-clamp-2">
            {notif.message}
          </p>
          {notif.task?.groupId && (
            <p className="mt-2 text-[11px] font-bold text-indigo-600">
              Mở task trong nhóm {notif.task.groupName || 'teamwork'}
            </p>
          )}
        </div>
      </div>
      {notif.status === 'unread' && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></span>
      )}
    </div>
  );
}
