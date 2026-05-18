/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CaretLeft,
  FileText,
  User,
  Calendar,
  Clock,
  ChatText,
  Spinner,
  Image as ImageIcon,
  Check,
  Eye,
  X,
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
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    name: string;
    mimeType: string;
  } | null>(null);

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
  const isAdmin = currentUserMember?.role === 'admin' || group.creatorId === currentUser?.id;
  const assigneeProfile = task.assigneeId ? getMemberProfile(task.assigneeId) : null;
  const assigneeMember = group.members?.find((member) => member.userId === task.assigneeId);
  const isAssigneeAdmin = assigneeMember?.role === 'admin' || group.creatorId === task.assigneeId;
  
  // Collaborative: Any group member can comment, EXCEPT the assignee of the task (no self-review)
  const canWriteComment = currentUserMember !== undefined && task.assigneeId !== currentUser?.id;
  
  const isImageFile = (mimeType: string) => mimeType?.toLowerCase()?.startsWith('image/');

  interface TaskComment {
    userId: string;
    userName: string;
    userAvatar: string | null;
    comment: string;
    createdAt: string;
  }

  const parseComments = (commentsStr: string | null | undefined): TaskComment[] => {
    if (!commentsStr) return [];
    try {
      const parsed = JSON.parse(commentsStr);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Legacy single string comment fallback
      return [
        {
          userId: 'legacy-admin',
          userName: 'Trưởng nhóm',
          userAvatar: null,
          comment: commentsStr,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return [];
  };

  const comments = parseComments(task?.leaderComments);

  const handleSaveComment = async () => {
    if (!commentText.trim()) return;
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: {
          leaderComments: commentText.trim(),
          groupId,
        },
      });
      setCommentText(''); // Clear comment input
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Không thể gửi nhận xét. Vui lòng thử lại sau.');
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
                <div className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {/* List Header */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/50 border-b border-gray-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-5">Tên file</div>
                    <div className="col-span-3">Ngày gửi</div>
                    <div className="col-span-2">Kích thước</div>
                    <div className="col-span-2 text-center">Xem trước</div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {task.attachments.map((att) => {
                      const uploaderProf = getMemberProfile(att.uploaderId);
                      const uploaderName = uploaderProf ? `${uploaderProf.firstName} ${uploaderProf.lastName}` : 'Thành viên';
                      const uploadDate = new Date(att.uploadedAt).toLocaleString('vi-VN');
                      const isImg = isImageFile(att.mimeType);

                      return (
                        <div key={att.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-slate-50/40 transition-colors group">
                          
                          {/* File Name & Icon */}
                          <div className="col-span-1 sm:col-span-5 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50/60 flex items-center justify-center border border-blue-100/30 shrink-0 text-blue-500">
                              {isImg ? (
                                <ImageIcon size={18} weight="bold" />
                              ) : (
                                <FileText size={18} weight="bold" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate" title={att.fileName}>
                                {att.fileName}
                              </p>
                              {/* Mobile-only responsive subtext */}
                              <p className="sm:hidden text-[9px] text-gray-400 mt-1 font-semibold">
                                Gửi bởi {uploaderName} • {uploadDate} • {formatBytes(att.fileSize)}
                              </p>
                            </div>
                          </div>

                          {/* Sender & Date (sm and up) */}
                          <div className="hidden sm:block sm:col-span-3 min-w-0">
                            <span className="text-[11px] font-bold text-gray-700 truncate block" title={uploaderName}>
                              {uploaderName}
                            </span>
                            <span className="text-[9px] font-medium text-gray-400 block mt-0.5">
                              {uploadDate}
                            </span>
                          </div>

                          {/* File Size (sm and up) */}
                          <div className="hidden sm:block sm:col-span-2">
                            <span className="text-xs font-semibold text-slate-500">
                              {formatBytes(att.fileSize)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="col-span-1 sm:col-span-2 flex items-center justify-start sm:justify-center">
                            <button
                              onClick={() => setPreviewAttachment({
                                url: buildAttachmentUrl(att.fileUrl),
                                name: att.fileName,
                                mimeType: att.mimeType
                              })}
                              className="p-2 rounded-xl bg-blue-50/60 text-blue-600 hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                              title="Xem trước minh chứng"
                            >
                              <Eye size={15} weight="bold" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-2xl bg-slate-50/30 text-center">
                  <FileText size={48} className="text-slate-300 mb-3" />
                  <p className="text-gray-500 text-sm font-semibold">Chưa có minh chứng hoặc file đính kèm.</p>
                  <p className="text-gray-400 text-xs mt-1">Các thành viên được phân công có thể upload minh chứng hoàn thành task.</p>
                </div>
              )}
            </div>

            {/* Reviews & Feedback Section */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                <ChatText size={20} className="text-blue-500 font-black" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Nhận xét & Đánh giá công việc
                </h3>
              </div>

              {/* Render Reviews List */}
              <div className="space-y-4 mb-6">
                {comments.length > 0 ? (
                  comments.map((c, index) => {
                    const avatarUrl = c.userAvatar;
                    const commentDate = new Date(c.createdAt).toLocaleString('vi-VN');
                    return (
                      <div
                        key={index}
                        className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200/50 flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-sm">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} weight="bold" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-800">{c.userName}</span>
                            <span className="text-[10px] font-bold text-gray-400">{commentDate}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-wrap leading-relaxed">
                            {c.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <ChatText size={32} className="text-slate-300 mb-2" />
                    <p className="text-xs text-gray-400 italic">Chưa có nhận xét nào cho task này.</p>
                  </div>
                )}
              </div>

              {/* Add Feedback Input Box */}
              {canWriteComment ? (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-black text-slate-700">Thêm nhận xét của bạn</h4>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full min-h-[100px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs text-gray-700 leading-relaxed placeholder-gray-400"
                    placeholder="VD: Tiến độ chuẩn xác, slide đầy đủ hoặc Cần cập nhật lại thông tin trong tài liệu..."
                    disabled={updateTask.isPending}
                  />
                  <div className="flex items-center justify-end gap-3">
                    {saveSuccess && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={14} weight="bold" /> Đã gửi nhận xét thành công!
                      </span>
                    )}
                    <button
                      onClick={handleSaveComment}
                      disabled={updateTask.isPending || !commentText.trim()}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {updateTask.isPending && <Spinner size={14} className="animate-spin" />}
                      Gửi nhận xét
                    </button>
                  </div>
                </div>
              ) : (
                task.assigneeId === currentUser?.id && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
                    <span className="text-lg shrink-0">💡</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                        Bạn đang được phân công thực hiện công việc này. Để đảm bảo tính khách quan trong đánh giá chéo giữa các thành viên, người thực hiện task không thể tự nhận xét công việc của chính mình.
                      </p>
                    </div>
                  </div>
                )
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
                      {task.assigneeId === currentUser?.id
                        ? (isAssigneeAdmin ? 'Bạn (Trưởng nhóm)' : 'Bạn')
                        : (isAssigneeAdmin ? 'Trưởng nhóm' : assigneeProfile ? 'Thành viên nhóm' : '--')}
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

      {/* Interactive High-Fidelity Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => setPreviewAttachment(null)} 
          />
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/30 text-blue-500 shrink-0">
                  {isImageFile(previewAttachment.mimeType) ? <ImageIcon size={16} weight="bold" /> : <FileText size={16} weight="bold" />}
                </div>
                <h3 className="text-sm font-extrabold text-gray-800 truncate" title={previewAttachment.name}>
                  {previewAttachment.name}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewAttachment(null)}
                className="p-2 rounded-xl hover:bg-slate-200/50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto flex items-center justify-center bg-slate-50/30 min-h-[300px] flex-1">
              {isImageFile(previewAttachment.mimeType) ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-md border border-gray-200/30"
                />
              ) : previewAttachment.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.name}
                  className="w-full h-[65vh] rounded-2xl border border-gray-200/50 shadow-md bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 max-w-sm">
                  <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center border border-orange-100/50 mb-4 animate-pulse">
                    <FileText size={32} weight="light" />
                  </div>
                  <p className="text-sm font-extrabold text-gray-800">Không thể xem trực tiếp định dạng này</p>
                  <p className="text-xs text-gray-400 mt-1 mb-6 leading-relaxed">
                    Trình duyệt không hỗ trợ xem trực tiếp trực tuyến cho file đính kèm này.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-white text-xs font-bold text-gray-500 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
