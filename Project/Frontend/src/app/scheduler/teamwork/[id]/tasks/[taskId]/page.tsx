'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CaretLeft,
  FileText,
  DownloadSimple,
  User,
  Calendar,
  Clock,
  CheckCircle,
  ChatText,
  Spinner,
  ArrowSquareOut,
  Image as ImageIcon,
  Check,
} from '@phosphor-icons/react';
import { useAuthStore } from '@/store/auth-store';
import { useGetGroupDetails } from '@/hooks/useGroups';
import { useGetGroupTaskDetails, useUpdateTask } from '@/hooks/useScheduler';
import { useUsersProfiles } from '@/hooks/useProfile';
import { API_PUBLIC_ORIGIN } from '@/lib/api-client';

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Thấp',
  2: 'Trung bình',
  3: 'Cao',
  4: 'Rất cao',
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600 border border-blue-100',
  2: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  3: 'bg-orange-50 text-orange-600 border border-orange-100',
  4: 'bg-red-50 text-red-600 border border-red-100',
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function TaskDetailsPage() {
  const { id: groupId, taskId } = useParams() as { id: string; taskId: string };
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const { data: group, isLoading: groupLoading } = useGetGroupDetails(groupId);
  const { data: task, isLoading: taskLoading, error } = useGetGroupTaskDetails(taskId);
  const updateTask = useUpdateTask();

  const [commentText, setCommentText] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (task?.leaderComments) {
      setCommentText(task.leaderComments);
    }
  }, [task?.leaderComments]);

  const memberIds = React.useMemo(() => {
    return group?.members?.map((m) => m.userId) || [];
  }, [group?.members]);

  const { data: profiles = [] } = useUsersProfiles(memberIds);

  const getMemberProfile = (userId: string) => {
    return profiles.find((p) => p.id === userId);
  };

  const buildAttachmentUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    return `${API_PUBLIC_ORIGIN}${fileUrl}`;
  };

  if (groupLoading || taskLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-gray-100 bg-white m-2 min-h-[400px]">
        <Spinner className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error || !task || !group) {
    return (
      <div className="flex flex-col h-full items-center justify-center rounded-3xl border border-gray-100 bg-white m-2 p-8 text-center min-h-[400px]">
        <FileText size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy task</h2>
        <p className="text-gray-500 max-w-md">Task này không tồn tại, đã bị xóa hoặc bạn không có quyền truy cập.</p>
        <button
          onClick={() => router.push(`/scheduler/teamwork/${groupId}`)}
          className="mt-6 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all"
        >
          Quay lại phòng làm việc
        </button>
      </div>
    );
  }

  const currentUserMember = group.members?.find((member) => member.userId === currentUser?.id);
  const isAdmin = currentUserMember?.role === 'admin';
  const isAssignee = task.assigneeId === currentUser?.id;
  const assigneeProfile = task.assigneeId ? getMemberProfile(task.assigneeId) : null;
  const isImageFile = (mimeType: string) => mimeType?.toLowerCase()?.startsWith('image/');

  const handleSaveComment = async () => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: {
          leaderComments: commentText.trim() || null,
          groupId,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Không thể lưu nhận xét. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="flex flex-col h-full rounded-3xl border border-gray-100 bg-white m-2 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40">
        <button
          onClick={() => router.push(`/scheduler/teamwork/${groupId}`)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-wider transition-colors mb-4 group"
        >
          <CaretLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại nhóm {group.name}
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {task.title}
            </h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${PRIORITY_COLORS[task.priority || 2]}`}>
                Ưu tiên: {PRIORITY_LABELS[task.priority || 2]}
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                task.status === 'done' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                task.submittedForReview ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                Trạng thái: {task.status === 'done' ? 'Đã hoàn thành' : task.submittedForReview ? 'Chờ duyệt' : 'Chờ thực hiện'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column (2/3 width) - Task detail, attachments and comments */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Task Description */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Mô tả công việc</h3>
              {task.description ? (
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{task.description}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">Không có mô tả chi tiết cho task này.</p>
              )}
            </div>

            {/* Attachments & Proofs */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Minh chứng & File đính kèm</h3>
              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.attachments.map((att) => {
                    const uploaderProf = getMemberProfile(att.uploaderId);
                    return (
                      <div key={att.id} className="border border-gray-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-all group">
                        <div>
                          {/* File Icon or Preview */}
                          {isImageFile(att.mimeType) ? (
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100 mb-3 border border-gray-100 flex items-center justify-center relative">
                              <img
                                src={buildAttachmentUrl(att.fileUrl)}
                                alt={att.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a
                                  href={buildAttachmentUrl(att.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/40 transition-colors"
                                  title="Xem ảnh lớn"
                                >
                                  <ArrowSquareOut size={20} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-32 rounded-xl bg-slate-100/80 mb-3 border border-gray-100 flex flex-col items-center justify-center text-slate-400 gap-2">
                              <FileText size={40} weight="light" />
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                                {att.mimeType?.split('/')?.[1]?.toUpperCase() || 'FILE'}
                              </span>
                            </div>
                          )}

                          <h4 className="font-bold text-gray-900 text-sm truncate" title={att.fileName}>
                            {att.fileName}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1 font-medium">{formatBytes(att.fileSize)}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                              {uploaderProf?.avatar ? (
                                <img src={uploaderProf.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <User size={12} weight="fill" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-gray-700 truncate">
                                {uploaderProf ? `${uploaderProf.firstName} ${uploaderProf.lastName}` : 'Người dùng'}
                              </p>
                              <p className="text-[9px] text-gray-400 font-medium">
                                {new Date(att.uploadedAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          <a
                            href={buildAttachmentUrl(att.fileUrl)}
                            download={att.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Tải xuống"
                          >
                            <DownloadSimple size={16} weight="bold" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-2xl bg-slate-50/30 text-center">
                  <FileText size={48} className="text-slate-300 mb-3" />
                  <p className="text-gray-500 text-sm font-semibold">Chưa có minh chứng hoặc file đính kèm.</p>
                  <p className="text-gray-400 text-xs mt-1">Các thành viên được phân công có thể upload minh chứng hoàn thành task.</p>
                </div>
              )}
            </div>

            {/* Leader Comments & Feedback */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                <ChatText size={20} className="text-blue-500" />
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Ý kiến phản hồi / Nhận xét của Trưởng nhóm</h3>
              </div>

              {isAdmin ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">Bạn là Trưởng nhóm. Hãy để lại ý kiến đóng góp, nhận xét hoặc hướng dẫn sửa chữa tại đây.</p>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full min-h-[120px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm text-gray-700 leading-relaxed placeholder-gray-400"
                    placeholder="VD: Minh chứng rất tốt, slide đầy đủ thông tin hoặc Cần sửa lại bố cục slide số 3 nhé..."
                    disabled={updateTask.isPending}
                  />
                  <div className="flex items-center justify-end gap-3">
                    {saveSuccess && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={14} weight="bold" /> Đã lưu thành công!
                      </span>
                    )}
                    <button
                      onClick={handleSaveComment}
                      disabled={updateTask.isPending}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {updateTask.isPending && <Spinner size={16} className="animate-spin" />}
                      Lưu nhận xét
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 min-h-[80px] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold flex-shrink-0">
                    👑
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900">Trưởng nhóm</p>
                    {task.leaderComments ? (
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed italic">
                        &ldquo;{task.leaderComments}&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1 italic">Chưa có nhận xét nào từ Trưởng nhóm.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column (1/3 width) - Sidebar with Metadata */}
          <div className="space-y-6">
            
            {/* Metadata Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-gray-50 pb-2">Thông tin Task</h3>
              
              {/* Assignee */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Người thực hiện</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold overflow-hidden">
                    {assigneeProfile?.avatar ? (
                      <img src={assigneeProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} weight="fill" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {assigneeProfile ? `${assigneeProfile.firstName} ${assigneeProfile.lastName}` : 'Chưa phân công'}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      {task.assigneeId === currentUser?.id ? 'Bản thân bạn' : assigneeProfile ? 'Thành viên nhóm' : '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={18} className="text-blue-500" />
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ngày giao</span>
                    <span className="text-sm font-bold text-gray-800">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : '--'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Clock size={18} className="text-blue-500" />
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hạn chót</span>
                    <span className="text-sm font-bold text-gray-800">
                      {task.dueTime ? new Date(task.dueTime).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
