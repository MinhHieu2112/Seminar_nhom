'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Envelope, Bell, ChatCircle, Spinner, UserPlus, Warning, Clock } from '@phosphor-icons/react';
import { useGetInvitations, useRespondToInvitation } from '@/hooks/useGroups';
import { useGetNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import type { GroupInvitation, Notification as NotificationType } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function NotificationMailbox() {
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

  const toggleOpen = (tab: 'invitations' | 'notifications') => {
    if (isOpen && activeTab === tab) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      setActiveTab(tab);
    }
  };

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      {/* Icons */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative">
          <ChatCircle size={20} weight="bold" />
        </button>
        
        <button 
          onClick={() => toggleOpen('invitations')}
          className={`p-2 rounded-full transition-all relative ${
            isOpen && activeTab === 'invitations' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <Envelope size={20} weight="bold" />
          {pendingInvCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {pendingInvCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => toggleOpen('notifications')}
          className={`p-2 rounded-full transition-all relative ${
            isOpen && activeTab === 'notifications' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <Bell size={20} weight="bold" />
          {unreadNotifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              {activeTab === 'invitations' ? 'Hòm thư mời' : 'Thông báo nhắc lịch'}
              {activeTab === 'invitations' ? (
                pendingInvCount > 0 && <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black">{pendingInvCount}</span>
              ) : (
                unreadNotifCount > 0 && <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black">{unreadNotifCount}</span>
              )}
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
                    <NotificationItem key={notif.id} notif={notif} onMarkRead={handleMarkRead} />
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

function NotificationItem({ notif, onMarkRead }: { notif: NotificationType, onMarkRead: (id: string) => void }) {
  const isUrgent = notif.title.includes('🔴 Gấp');
  const isWarning = notif.title.includes('⚠️ Nhắc nhở');

  return (
    <div 
      className={`p-4 transition-colors group relative ${notif.status === 'unread' ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
      onClick={() => notif.status === 'unread' && onMarkRead(notif.id)}
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
        </div>
      </div>
      {notif.status === 'unread' && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></span>
      )}
    </div>
  );
}
