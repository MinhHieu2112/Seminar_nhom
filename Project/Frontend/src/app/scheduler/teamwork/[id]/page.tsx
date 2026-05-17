'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Calendar,
  Plus,
  Crown,
  User,
  Spinner,
  X,
  PencilSimple,
  Trash,
  CheckCircle,
  Clock,
  UploadSimple,
  FileText,
  Check,
} from '@phosphor-icons/react';
import { useAuthStore } from '@/store/auth-store';
import { AddMemberModal } from '@/components/teamwork/AddMemberModal';
import { EditGroupModal } from '@/components/teamwork/EditGroupModal';
import { useGetGroupDetails, useDeleteGroup, useRemoveMember } from '@/hooks/useGroups';
import { useUsersProfiles } from '@/hooks/useProfile';
import {
  useCreateTask,
  useSchedulerTasks,
  useDeleteTask,
  useUpdateTask,
  useApproveTask,
  useRejectTask,
} from '@/hooks/useScheduler';
import { UploadEvidenceModal } from '@/components/teamwork/UploadEvidenceModal';
import { ChatTab } from '@/components/teamwork/ChatTab';


function getErrorMessage(error: unknown, fallback: string) {
  const payload = error as { response?: { data?: { message?: string | string[] } } };
  const message = payload.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Thấp',
  2: 'Trung bình',
  3: 'Cao',
  4: 'Rất cao',
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600',
  2: 'bg-emerald-50 text-emerald-600',
  3: 'bg-orange-50 text-orange-600',
  4: 'bg-red-50 text-red-600',
};



export default function GroupDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuthStore();
  const { data: group, isLoading, error } = useGetGroupDetails(id);
  const { data: groupTasks = [] } = useSchedulerTasks(id);
  const highlightedTaskId = searchParams.get('taskId');
  const taskRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const memberIds = useMemo(() => {
    return group?.members?.map((m) => m.userId) || [];
  }, [group?.members]);

  const { data: profiles = [] } = useUsersProfiles(memberIds);

  const getMemberProfile = (userId: string) => {
    return profiles.find((p) => p.id === userId);
  };

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const deleteGroupMutation = useDeleteGroup();
  const removeMemberMutation = useRemoveMember();

  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'chat'>('tasks');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [uploadModalTaskId, setUploadModalTaskId] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  const approveTask = useApproveTask();
  const rejectTask = useRejectTask();

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueTime: '',
    priority: '3',
    assigneeId: '',
  });

  const orderedTasks = useMemo(() => {
    return [...groupTasks].sort((a, b) => {
      const aTime = a.dueTime ? new Date(a.dueTime).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueTime ? new Date(b.dueTime).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [groupTasks]);

  useEffect(() => {
    if (!highlightedTaskId) return;

    const row = taskRowRefs.current[highlightedTaskId];
    if (!row) return;

    row.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [highlightedTaskId, orderedTasks]);

  const handleDeleteGroup = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      await deleteGroupMutation.mutateAsync(id);
      router.push('/scheduler');
    } catch {
      alert('Không thể xóa nhóm. Vui lòng thử lại sau.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa task này?')) return;
    try {
      await deleteTask.mutateAsync({ id: taskId, groupId: id });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message || 'Không thể xóa task. Vui lòng thử lại sau.';
      alert(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);

    if (!taskForm.title.trim()) {
      setTaskError('Tên task không được để trống.');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        dueTime: taskForm.dueTime ? new Date(taskForm.dueTime).toISOString() : undefined,
        priority: Number(taskForm.priority),
        groupId: group?.id,
        assigneeId: taskForm.assigneeId || undefined,
      });
      setTaskForm({ title: '', description: '', dueTime: '', priority: '3', assigneeId: '' });
      setIsTaskModalOpen(false);
    } catch (submitError) {
      setTaskError(getErrorMessage(submitError, 'Không thể tạo task nhóm.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-gray-100 bg-white m-2">
        <Spinner className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col h-full items-center justify-center rounded-3xl border border-gray-100 bg-white m-2 p-8 text-center">
        <Users size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy nhóm</h2>
        <p className="text-gray-500 max-w-md">Nhóm này không tồn tại hoặc bạn không có quyền truy cập.</p>
      </div>
    );
  }

  const currentUserMember = group.members?.find((member) => member.userId === currentUser?.id);
  const isAdmin = currentUserMember?.role === 'admin';

  return (
    <div className="flex flex-col h-full rounded-3xl border border-gray-100 bg-white m-2 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {group.name}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Crown size={12} weight="fill" />
                    Admin
                  </span>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Sửa nhóm"
                  >
                    <PencilSimple size={18} />
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Xóa nhóm"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              )}
            </h1>
            {group.description && <p className="text-gray-500 mt-2 text-sm">{group.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <Users size={16} />
                {group._count?.members || group.members?.length || 0} thành viên
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} />
                Tạo ngày {new Date(group.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isAdmin && (
              <button
                onClick={() => {
                  setTaskError(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
              >
                <Plus size={18} weight="bold" />
                Thêm task mới
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
          >
            Phân công
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
          >
            Thành viên
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
          >
            Thảo luận
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {activeTab === 'tasks' && (
          <div className="p-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left table-fixed">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[20%]" />
                  <col className="w-[15%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">STT</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên công việc</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Ngày phân công</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hạn chót</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Ưu tiên</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Phân công</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">File tải lên</th>
                    <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orderedTasks.length > 0 ? (
                    orderedTasks.map((task, index) => {
                      return (
                        <tr
                          key={task.id}
                          ref={(node) => {
                            taskRowRefs.current[task.id] = node;
                          }}
                          className={`transition-colors group ${highlightedTaskId === task.id
                              ? 'bg-blue-50/70 ring-1 ring-inset ring-blue-200'
                              : 'hover:bg-gray-50/50'
                            }`}
                        >
                          <td className="px-4 py-4 text-sm font-bold text-gray-400">{index + 1}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {task.title}
                              </span>
                              {task.description && <span className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                              <Calendar size={13} />
                              <span className="truncate">{task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : '---'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                              <Clock size={13} />
                              <span className="truncate">{task.dueTime ? new Date(task.dueTime).toLocaleDateString('vi-VN') : '---'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${PRIORITY_COLORS[task.priority || 2]}`}>
                              {PRIORITY_LABELS[task.priority || 2]}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`flex items-center gap-1 text-xs font-bold ${task.status === 'done' ? 'text-emerald-500' :
                                task.submittedForReview ? 'text-blue-500' : 'text-amber-500'
                              }`}>
                              {task.status === 'done' ? <CheckCircle size={13} weight="fill" /> : <Clock size={13} weight="fill" />}
                              {task.status === 'done' ? 'Xong' : task.submittedForReview ? 'Chờ duyệt' : 'Chờ'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={task.assigneeId ?? ''}
                              onChange={(e) => updateTask.mutate({ id: task.id, data: { assigneeId: e.target.value || null, groupId: id } })}
                              disabled={!isAdmin || task.status === 'done'}
                              className={`w-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none transition-all truncate ${isAdmin && task.status !== 'done' ? 'focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                            >
                              <option value="">-- Chưa phân công --</option>
                              {group.members?.map(m => {
                                const p = getMemberProfile(m.userId);
                                return (
                                  <option key={m.userId} value={m.userId}>
                                    {m.userId === currentUser?.id ? 'Tôi' : `${m.role === 'admin' ? '👑 ' : ''}${p ? `${p.firstName} ${p.lastName}` : `User ${m.userId.substring(0, 6)}...`}`}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => router.push(`/scheduler/teamwork/${id}/tasks/${task.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[10px] transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                              <FileText size={12} weight="bold" />
                              Chi tiết
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {isAdmin && task.submittedForReview && task.status !== 'done' && (
                                <>
                                  <button
                                    onClick={() => approveTask.mutate(task.id)}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                    title="Duyệt task"
                                  >
                                    <Check size={16} weight="bold" />
                                  </button>
                                  <button
                                    onClick={() => rejectTask.mutate(task.id)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                    title="Từ chối"
                                  >
                                    <X size={16} weight="bold" />
                                  </button>
                                </>
                              )}

                              {!isAdmin && task.assigneeId === currentUser?.id && task.status !== 'done' && (
                                <>
                                  {(!task.attachments || task.attachments.length === 0) ? (
                                    <button
                                      onClick={() => setUploadModalTaskId(task.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[10px] transition-all"
                                    >
                                      <UploadSimple size={14} weight="bold" />
                                      NỘP FILE
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setUploadModalTaskId(task.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[10px] transition-all hover:scale-105 active:scale-95 shadow-sm"
                                      title="Sửa / Cập nhật minh chứng"
                                    >
                                      <PencilSimple size={14} weight="bold" />
                                      CẬP NHẬT
                                    </button>
                                  )}
                                </>
                              )}

                              {isAdmin &&
                                !task.submittedForReview &&
                                task.status !== 'done' &&
                                !(task.dueTime && new Date(task.dueTime) < new Date()) && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                  title="Xóa task"
                                >
                                  <Trash size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                        Chưa có task nhóm nào được tạo. Nhấn &quot;Thêm task mới&quot; để bắt đầu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <UploadEvidenceModal
          isOpen={!!uploadModalTaskId}
          onClose={() => setUploadModalTaskId(null)}
          taskId={uploadModalTaskId || ''}
          groupId={id}
          existingAttachments={orderedTasks.find((t) => t.id === uploadModalTaskId)?.attachments || []}
        />

        {activeTab === 'members' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Danh sách thành viên</h3>
              {isAdmin && (
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm shadow-emerald-500/20"
                >
                  <Plus size={16} weight="bold" />
                  Thêm thành viên
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members?.map((member) => {
                const profile = getMemberProfile(member.userId);
                const isSelf = member.userId === currentUser?.id;
                const isCreator = member.userId === group.creatorId;
                const canRemove = isAdmin && !isSelf && !isCreator;
                return (
                  <div key={member.id} className="p-4 border border-gray-100 rounded-2xl flex items-center gap-4 bg-white hover:shadow-md transition-all group/member">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${member.role === 'admin' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}>
                      {profile?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        member.role === 'admin' ? <Crown size={20} weight="fill" /> : <User size={20} weight="fill" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span className="truncate">
                          {profile ? `${profile.firstName} ${profile.lastName}` : `User ${member.userId.substring(0, 8)}...`}
                        </span>
                        {isSelf && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex-shrink-0">Bạn</span>}
                        {isCreator && <span className="text-[10px] bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded flex-shrink-0">Trưởng nhóm</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</div>
                    </div>
                    {canRemove && (
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa ${profile ? `${profile.firstName} ${profile.lastName}` : 'thành viên này'} khỏi nhóm?`)) {
                            removeMemberMutation.mutate({ groupId: id, targetUserId: member.userId });
                          }
                        }}
                        disabled={removeMemberMutation.isPending}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/member:opacity-100 disabled:opacity-50"
                        title="Xóa thành viên"
                      >
                        {removeMemberMutation.isPending ? <Spinner size={16} className="animate-spin" /> : <Trash size={16} weight="bold" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="p-8">
            <ChatTab
              groupId={id}
              groupName={group.name}
              groupMembers={group.members || []}
              tasks={orderedTasks}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddMemberOpen && <AddMemberModal group={group} onClose={() => setIsAddMemberOpen(false)} />}
      {isEditModalOpen && <EditGroupModal group={group} onClose={() => setIsEditModalOpen(false)} />}

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div>
                <h2 className="font-bold text-lg text-gray-900">Thêm task nhóm mới</h2>
                <p className="text-sm text-gray-500 mt-1">Lên kế hoạch công việc dùng chung cho nhóm.</p>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200">
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {taskError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{taskError}</div>}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên công việc</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="VD: Nghiên cứu tài liệu Seminar"
                  disabled={createTask.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mô tả</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[100px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Mô tả chi tiết công việc..."
                  disabled={createTask.isPending}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Mức ưu tiên</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    disabled={createTask.isPending}
                  >
                    <option value="1">1 - Thấp</option>
                    <option value="2">2 - Trung bình</option>
                    <option value="3">3 - Cao</option>
                    <option value="4">4 - Rất cao</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Hạn chót</label>
                  <input
                    type="datetime-local"
                    value={taskForm.dueTime}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, dueTime: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={createTask.isPending}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                  disabled={createTask.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 transition-all"
                  disabled={createTask.isPending}
                >
                  {createTask.isPending && <Spinner size={16} className="animate-spin" />}
                  Lưu task nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
