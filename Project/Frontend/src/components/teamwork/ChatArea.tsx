/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useGetGroupMessages } from '@/hooks/useScheduler';
import { API_PUBLIC_ORIGIN } from '@/lib/api-client';
import { StickerPicker } from './StickerPicker';
import { MentionAutocomplete } from './MentionAutocomplete';
import type { GroupMessage, GroupMessageType, GroupMember, GroupMessageAttachment } from '@/types/api';
import { io, Socket } from 'socket.io-client';
import {
  PaperPlaneRight,
  Smiley,
  DownloadSimple,
  File,
  Trash,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface ChatAreaProps {
  groupId: string;
  groupName: string;
  groupMembers: (GroupMember & {
    user?: {
      id: string;
      name: string | null;
      avatar: string | null;
    } | null;
  })[];
  activeChannel: { id: string; title: string; type: 'general' | 'task' };
}

export function ChatArea({ groupId, groupName, groupMembers, activeChannel }: ChatAreaProps) {
  const { user: currentUser, accessToken } = useAuthStore();
  const [liveMessages, setLiveMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<{ id: string; name: string }[]>([]);
  const [attachments] = useState<GroupMessageAttachment[]>([]);
  const [showStickers, setShowStickers] = useState(false);
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`deleted_msgs_${currentUser?.id || 'anon'}_${groupId}`);
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // Mention State
  const [showMention, setShowMention] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  // Presence & Typing State
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const taskId = activeChannel.type === 'task' ? activeChannel.id : undefined;

  // React Query paginated message hook
  const {
    data: historicalData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetGroupMessages(groupId, taskId);

  const flattenedHistory = React.useMemo<GroupMessage[]>(() => {
    return historicalData?.pages.flatMap((page: { messages?: GroupMessage[] }) => page.messages || []) || [];
  }, [historicalData]);

  const messages = React.useMemo<GroupMessage[]>(() => {
    const historyIds = new Set(flattenedHistory.map((m) => m.id));
    const uniqueLive = liveMessages.filter((m) => !historyIds.has(m.id));
    const allMsgs = [...flattenedHistory, ...uniqueLive];
    return allMsgs.filter((m) => !deletedMessageIds.has(m.id));
  }, [flattenedHistory, liveMessages, deletedMessageIds]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Socket.IO connection
  useEffect(() => {
    if (!currentUser) return;

    // Connect securely to API Gateway WebSocket proxy
    const wsUrl = process.env.NEXT_PUBLIC_TEAMWORK_WS_URL || API_PUBLIC_ORIGIN || 'http://localhost:8000';
    const socket = io(wsUrl, {
      auth: { token: accessToken },
      query: { userId: currentUser.id },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Join general group room
      socket.emit('joinGroup', { groupId });
    });

    // Listen for realtime messages
    socket.on('messageReceived', (newMsg: GroupMessage) => {
      // Filter out messages that belong to a different channel
      const msgTaskId = newMsg.taskId || undefined;
      const currentTaskId = activeChannel.type === 'task' ? activeChannel.id : undefined;

      if (newMsg.groupId === groupId && msgTaskId === currentTaskId) {
        setLiveMessages((prev) => {
          // Avoid duplicate appends
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
      }
    });

    // Realtime deletion handler is disabled globally to satisfy the "other users not affected" requirement

    // Listen for presence updates
    socket.on('onlineUsers', (userIds: string[]) => {
      setOnlineUserIds(userIds);
    });

    // Listen for typing events
    socket.on('userTypingStart', (data: { userId: string; userName: string; taskId?: string }) => {
      const currentTaskId = activeChannel.type === 'task' ? activeChannel.id : undefined;
      if (data.userId !== currentUser.id && data.taskId === currentTaskId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.userName);
          return next;
        });
      }
    });

    socket.on('userTypingEnd', (data: { userId: string; taskId?: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [groupId, activeChannel, currentUser, accessToken]);

  // Track previous group/channel to reset state synchronously on switch (prevents cascading renders)
  const [prevGroupId, setPrevGroupId] = useState<string>(groupId);
  const [prevActiveChannelId, setPrevActiveChannelId] = useState<string>(activeChannel.id);

  if (groupId !== prevGroupId || activeChannel.id !== prevActiveChannelId) {
    setPrevGroupId(groupId);
    setPrevActiveChannelId(activeChannel.id);
    setLiveMessages([]);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`deleted_msgs_${currentUser?.id || 'anon'}_${groupId}`);
        setDeletedMessageIds(stored ? new Set(JSON.parse(stored)) : new Set());
      } catch {
        setDeletedMessageIds(new Set());
      }
    } else {
      setDeletedMessageIds(new Set());
    }
  }



  // Synchronize DOM scroll on group or channel change (pure layout side-effect, zero state cascading)
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timer);
  }, [groupId, activeChannel.id]);

  const handleDeleteMessage = (messageId: string) => {
    setDeletedMessageIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `deleted_msgs_${currentUser?.id || 'anon'}_${groupId}`,
          JSON.stringify(Array.from(next))
        );
      }
      return next;
    });
  };

  // Handle typing state triggers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Notify peers that user is typing
    if (socketRef.current && currentUser) {
      if (val.trim().length > 0) {
        socketRef.current.emit('typingStart', {
          groupId,
          userName: currentUser.name || 'Thành viên',
          taskId,
        });
      } else {
        socketRef.current.emit('typingEnd', { groupId, taskId });
      }
    }

    // Mention triggers detection
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ')) {
      const search = textBeforeCursor.slice(lastAt + 1);
      if (!search.includes(' ')) {
        setShowMention(true);
        setMentionSearch(search);
        return;
      }
    }
    setShowMention(false);
  };

  // Trigger @Mention selection insert
  const handleSelectMention = (user: { id: string; name: string }) => {
    const value = inputText;
    const cursor = value.slice(0, value.length).lastIndexOf('@');
    const textBefore = value.slice(0, cursor);
    const updatedVal = `${textBefore}@${user.name} `;
    setInputText(updatedVal);
    setSelectedMentions((prev) => {
      if (prev.some((m) => m.id === user.id)) return prev;
      return [...prev, user];
    });
    setShowMention(false);
  };

  // Submit new standard text message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    let finalContent = inputText;
    selectedMentions.forEach((mention) => {
      finalContent = finalContent.split(`@${mention.name}`).join(`@[${mention.name}](${mention.id})`);
    });

    const payload = {
      groupId,
      taskId,
      content: finalContent,
      messageType: (attachments.length > 0 ? (attachments[0].mimeType.startsWith('image/') ? 'IMAGE' : 'FILE') : 'TEXT') as GroupMessageType,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    if (socketRef.current) {
      socketRef.current.emit('sendMessage', payload);
    }

    setInputText('');
    setSelectedMentions([]);
    if (socketRef.current) {
      socketRef.current.emit('typingEnd', { groupId, taskId });
    }
  };

  // Submit Sticker direct message
  const handleSendSticker = (sticker: { id: string; url: string; packName: string }) => {
    const payload = {
      groupId,
      taskId,
      content: `[Sticker: ${sticker.packName}]`,
      messageType: 'STICKER' as GroupMessageType,
      sticker: {
        stickerId: sticker.id,
        stickerUrl: sticker.url,
        packName: sticker.packName,
      },
    };

    if (socketRef.current) {
      socketRef.current.emit('sendMessage', payload);
    }
    setShowStickers(false);
  };

  // Render markdown mentions styled cleanly
  const renderMessageContent = (content: string) => {
    const parts = [];
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(
        <span
          key={match.index}
          className="text-blue-600 font-bold bg-blue-50/80 hover:bg-blue-100/60 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer text-xs mr-0.5"
        >
          @{match[1]}
        </span>
      );
      lastIndex = mentionRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  // Handle intersection scroll loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[600px] bg-slate-50/50 rounded-3xl border border-gray-100 overflow-hidden relative shadow-sm">
      
      {/* Realtime Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-sm font-extrabold text-gray-800">
              {activeChannel.type === 'general' ? `💬 ${groupName}` : `📌 Task: ${activeChannel.title}`}
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
            {activeChannel.type === 'general' ? 'Kênh thảo luận chung cho cả nhóm' : 'Thảo luận riêng về nhiệm vụ này'}
          </p>
        </div>

        {/* Presence members strip */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-2 overflow-hidden">
            {groupMembers.slice(0, 5).map((m) => {
              const isOnline = onlineUserIds.includes(m.userId);
              return (
                <div
                  key={m.id}
                  className={`w-7 h-7 rounded-full border-2 border-white relative overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 ${
                    isOnline ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
                  }`}
                  title={`${m.user?.name || 'Thành viên'} (${isOnline ? 'Online' : 'Offline'})`}
                >
                  {m.user?.avatar ? (
                    <img src={m.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-extrabold text-gray-400">
                      {(m.user?.name || 'U').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                  )}
                </div>
              );
            })}
          </div>
          {groupMembers.length > 5 && (
            <span className="text-[10px] text-gray-400 font-bold pl-1">+{groupMembers.length - 5}</span>
          )}
        </div>
      </div>

      {/* Messages Pane */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-slate-50/50 relative"
      >
        {isFetchingNextPage && (
          <div className="w-full flex items-center justify-center py-2">
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser?.id;
            const nextMsg = messages[index + 1];
            const isConsecutive = nextMsg && nextMsg.senderId === msg.senderId && 
                                  (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 120000); // 2 minutes window

            const canDelete = true; // "Delete for me" is available for all messages!

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mb-1' : 'mb-4'}`}
              >
                {/* Profile Avatar (left) */}
                {!isMe && !isConsecutive && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center relative overflow-hidden shrink-0 border border-gray-100 shadow-sm mt-0.5">
                    {msg.sender?.avatar ? (
                      <img src={msg.sender.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-extrabold text-gray-400">
                        {(msg.sender?.name || 'U').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                {!isMe && isConsecutive && <div className="w-8 shrink-0" />}

                {/* Content Container */}
                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender title */}
                  {!isMe && !isConsecutive && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-extrabold text-gray-700">
                        {msg.sender?.name || 'Thành viên'}
                      </span>
                      <span className="text-[8px] text-gray-400 font-semibold">
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </span>
                    </div>
                  )}

                  {/* Side-by-side bubble & delete action container */}
                  <div className="flex items-center gap-2 group w-full">
                    {isMe && canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 shadow-sm shrink-0 duration-150"
                        title="Xóa ở phía tôi"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    )}

                    {/* Sticker Message Template */}
                    {msg.messageType === 'STICKER' && msg.sticker ? (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-1 select-none flex items-center justify-center"
                      >
                        <img
                          src={msg.sticker.stickerUrl}
                          alt="sticker"
                          className="w-28 h-28 object-contain drop-shadow-md select-none"
                        />
                      </motion.div>
                    ) : (
                      // Regular and Rich message bubbles
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm relative ${
                          isMe
                            ? 'bg-blue-600 text-white font-medium rounded-tr-sm'
                            : 'bg-white text-gray-700 border border-gray-100 rounded-tl-sm'
                        }`}
                      >
                        {/* Rich File/Image Attachment Displays */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2 space-y-1.5 max-w-sm">
                            {msg.attachments.map((att) => {
                              const isImage = att.mimeType.startsWith('image/');
                              if (isImage) {
                                return (
                                  <a
                                    key={att.id}
                                    href={att.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:brightness-95 hover:scale-[1.01]"
                                  >
                                    <img src={att.fileUrl} alt={att.fileName} className="max-w-full max-h-48 object-cover" />
                                  </a>
                                );
                              } else {
                                return (
                                  <div
                                    key={att.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] gap-3 font-semibold ${
                                      isMe ? 'bg-blue-700/40 border-blue-500 text-white' : 'bg-slate-50 border-gray-100 text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <File size={20} className={isMe ? 'text-blue-200' : 'text-gray-400'} />
                                      <span className="truncate max-w-[120px]" title={att.fileName}>
                                        {att.fileName}
                                      </span>
                                      <span className="text-[9px] opacity-75 shrink-0">
                                        ({Math.round(att.fileSize / 1024)} KB)
                                      </span>
                                    </div>
                                    <a
                                      href={att.fileUrl}
                                      download={att.fileName}
                                      className={`p-1.5 rounded-lg hover:bg-black/10 shrink-0 transition-colors ${
                                        isMe ? 'text-white' : 'text-gray-500'
                                      }`}
                                    >
                                      <DownloadSimple size={14} weight="bold" />
                                    </a>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        )}
                        
                        {/* Bubble Text */}
                        <p>{renderMessageContent(msg.content)}</p>
                      </div>
                    )}

                    {!isMe && canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 shadow-sm shrink-0 duration-150"
                        title="Xóa ở phía tôi"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicators Banner */}
      {typingUsers.size > 0 && (
        <div className="absolute bottom-20 left-6 px-3 py-1 bg-white/95 border border-gray-100 rounded-full flex items-center gap-1.5 text-[9px] text-gray-500 font-bold shadow-md z-20 backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex gap-0.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-150" />
          </div>
          <span>
            {Array.from(typingUsers.values()).join(', ')} đang soạn tin nhắn...
          </span>
        </div>
      )}

      {/* Input panel & Attachments Preview */}
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2 relative shadow-md">
        


        {/* Input Bar layout */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 relative">
          


          {/* Textarea Workspace */}
          <div className="flex-1 bg-slate-50 border border-gray-100 rounded-2xl p-2 focus-within:bg-white focus-within:border-blue-400 transition-all relative flex items-center">
            
            {/* Suggestion Dropdown Popover */}
            {showMention && (
              <MentionAutocomplete
                members={groupMembers}
                searchQuery={mentionSearch}
                onSelect={handleSelectMention}
              />
            )}

            <textarea
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Gõ tin nhắn, dùng @ để nhắc tên..."
              className="flex-1 max-h-24 min-h-[36px] bg-transparent outline-none border-none text-xs text-gray-700 placeholder-gray-400 font-medium resize-none py-2 px-1 custom-scrollbar leading-relaxed"
            />

            {/* Sticker popover and picker */}
            <div className="relative">
              {showStickers && (
                <div className="absolute bottom-full right-0 mb-4 z-40">
                  <div className="fixed inset-0" onClick={() => setShowStickers(false)} />
                  <div className="relative">
                    <StickerPicker onSelect={handleSendSticker} onClose={() => setShowStickers(false)} />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowStickers((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors hover:bg-gray-100 ${
                  showStickers ? 'text-blue-500 bg-blue-50' : 'text-gray-400'
                }`}
                title="Gửi sticker"
              >
                <Smiley size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={!inputText.trim() && attachments.length === 0}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:bg-blue-600 text-white font-bold transition-all shadow-md flex items-center justify-center shrink-0"
          >
            <PaperPlaneRight size={16} weight="fill" />
          </button>
        </form>
      </div>
    </div>
  );
}
