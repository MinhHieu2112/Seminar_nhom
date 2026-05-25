'use client';

import React, { useState, useMemo } from 'react';
import {
    Plus, X, GraduationCap, Check,
    MagnifyingGlass, Sparkle,
    PencilSimple, Trash, CalendarBlank,
    SquaresFour, MathOperations, Atom, Flask,
    BookOpen, Code, FunnelSimple, Clock, CaretDown, Calendar} from '@phosphor-icons/react';
import {
    useSchedulerCategories, useSchedulerTasks,
    useCreateCategory, useCreateTask,
    useUpdateCategory, useDeleteCategory,
    useUpdateTask, useDeleteTask
} from '@/hooks/useScheduler';
import { AiScheduleModal } from './AiScheduleModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Task, Category } from '@/types/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
    { hex: '#6D5EF5', light: '#EEF2FF', dark: '#5b4fe0' }, // violet/indigo (primary theme)
    { hex: '#EC4899', light: '#FDF2F8', dark: '#BE185D' }, // pink
    { hex: '#10B981', light: '#ECFDF5', dark: '#047857' }, // emerald
    { hex: '#F59E0B', light: '#FFFBEB', dark: '#B45309' }, // amber
    { hex: '#3B82F6', light: '#EFF6FF', dark: '#1D4ED8' }, // blue
    { hex: '#8B5CF6', light: '#F5F3FF', dark: '#6D28D9' }, // purple
];

const PRIORITY_META: Record<number, { label: string; color: string; bg: string; border: string; dotColor: string }> = {
    1: { label: 'Thấp', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-150', dotColor: 'bg-slate-400' },
    2: { label: 'Thường', color: 'text-blue-700', bg: 'bg-blue-50/60', border: 'border-blue-200/50', dotColor: 'bg-blue-500' },
    3: { label: 'Cao', color: 'text-orange-700', bg: 'bg-orange-50/70', border: 'border-orange-200/50', dotColor: 'bg-orange-550' },
    4: { label: 'Rất cao', color: 'text-rose-705', bg: 'bg-rose-50/70', border: 'border-rose-200/50', dotColor: 'bg-rose-500' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; dotColor: string }> = {
    pending: { label: 'Chờ', color: 'text-amber-705', bg: 'bg-amber-50/60', border: 'border-amber-200/50', dotColor: 'bg-amber-500' },
    scheduled: { label: 'Đã lên lịch', color: 'text-indigo-705', bg: 'bg-indigo-50/60', border: 'border-indigo-200/50', dotColor: 'bg-indigo-500' },
    done: { label: 'Đã xong', color: 'text-emerald-705', bg: 'bg-emerald-50/60', border: 'border-emerald-200/50', dotColor: 'bg-emerald-500' },
    skipped: { label: 'Bỏ qua', color: 'text-slate-550', bg: 'bg-slate-50', border: 'border-slate-200/60', dotColor: 'bg-slate-400' },
};

// ─── Utility helpers ─────────────────────────────────────────────────────────

/** Returns local date string YYYY-MM-DD without timezone shift. */
const getLocalDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const CATEGORY_ICONS = [
    { icon: MathOperations, color: '#10B981', bg: '#E6F4EA' }, // green
    { icon: Atom, color: '#3B82F6', bg: '#E8F0FE' },           // blue
    { icon: Flask, color: '#EC4899', bg: '#FCE8E6' },          // pink
    { icon: BookOpen, color: '#F59E0B', bg: '#FEF3D6' },       // amber
    { icon: Code, color: '#8B5CF6', bg: '#F3E8FF' }            // purple
];

const getCategoryMeta = (idx: number) => {
    return CATEGORY_ICONS[idx % CATEGORY_ICONS.length];
};

// ─── Inline Add-Task Row ──────────────────────────────────────────────────────

function CreateTaskModal({ categoryId, onClose, onSave }: {
    categoryId: string;
    onClose: () => void;
    onSave: (d: {
        title: string;
        categoryId: string;
        dueTime?: string;
        priority?: number;
        status?: string;
        type?: 'TASK' | 'SESSION';
        sessionData?: { startTime: string; endTime: string };
    }) => Promise<void>;
}) {
    const [title, setTitle] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState(2);
    const [status, setStatus] = useState('pending');
    const [type, setType] = useState<'TASK' | 'SESSION'>('TASK');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setError('');

        if (type === 'SESSION') {
            if (!startTime || !endTime) {
                setError('Vui lòng chọn thời gian bắt đầu và kết thúc.');
                return;
            }
            const sDate = new Date(startTime);
            const eDate = new Date(endTime);
            if (sDate >= eDate) {
                setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
                return;
            }
            if (sDate.toDateString() !== eDate.toDateString()) {
                setError('Thời gian bắt đầu và phiên kết thúc phải trong cùng một ngày.');
                return;
            }
        }

        setSaving(true);
        try {
            if (type === 'SESSION') {
                if (status === 'done') {
                    const todayStr = getLocalDateStr(new Date());
                    const sDate = new Date(startTime);
                    const refStr = getLocalDateStr(sDate);
                    if (refStr > todayStr) {
                        setError('Không thể đánh dấu hoàn thành phiên học trong tương lai.');
                        setSaving(false);
                        return;
                    }
                }
                await onSave({
                    title: title.trim(),
                    categoryId,
                    priority,
                    status,
                    type,
                    sessionData: {
                        startTime: new Date(startTime).toISOString(),
                        endTime: new Date(endTime).toISOString(),
                    }
                });
            } else {
                await onSave({
                    title: title.trim(),
                    categoryId,
                    dueTime: dueTime ? new Date(dueTime).toISOString() : undefined,
                    priority,
                    status,
                    type,
                });
            }
            onClose();
        } catch (err) {
            const error = err as { response?: { data?: { message?: string | string[] } } };
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg p-7 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Thêm công việc mới</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Tạo công việc thường hoặc khóa lịch học tập</p>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Segmented type selector */}
                <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl mb-5">
                    <button
                        type="button"
                        onClick={() => { setType('TASK'); setError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${type === 'TASK' ? 'bg-white text-[#6D5EF5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <GraduationCap weight="bold" size={15} />
                        Công việc thường
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('SESSION'); setError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${type === 'SESSION' ? 'bg-white text-[#6D5EF5] shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Sparkle weight="bold" size={15} />
                        Phiên học (Khóa lịch)
                    </button>
                </div>

                <form onSubmit={save} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tên công việc</label>
                        <input autoFocus type="text" value={title}
                            onChange={e => { setTitle(e.target.value); setError(''); }}
                            placeholder={type === 'TASK' ? "VD: Làm bài tập toán cao cấp..." : "VD: Học chương 1 toán cao cấp..."}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-800 transition-all"
                        />
                    </div>

                    {type === 'TASK' ? (
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Hạn chót</label>
                            <input type="datetime-local" value={dueTime} onChange={e => setDueTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-750 transition-all"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Bắt đầu</label>
                                <input type="datetime-local" value={startTime} onChange={e => { setStartTime(e.target.value); setError(''); }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-750 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Kết thúc</label>
                                <input type="datetime-local" value={endTime} onChange={e => { setEndTime(e.target.value); setError(''); }}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-750 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Độ ưu tiên</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPriorityDropdown(!showPriorityDropdown);
                                    setShowStatusDropdown(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 focus:border-[#6D5EF5] rounded-xl outline-none text-xs font-semibold text-slate-700 transition-all text-left shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${PRIORITY_META[priority]?.dotColor}`} />
                                    <span>{PRIORITY_META[priority]?.label || 'Chọn'}</span>
                                </div>
                                <CaretDown size={14} weight="bold" className={`text-slate-400 transition-transform duration-200 ${showPriorityDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showPriorityDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-[210]" 
                                        onClick={() => setShowPriorityDropdown(false)}
                                    />
                                    <div className="absolute left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.06)] rounded-xl p-1.5 z-[220] flex flex-col gap-1 animate-in fade-in slide-in-from-top-1.5 duration-100">
                                        {[1, 2, 3, 4].map((p) => {
                                            const meta = PRIORITY_META[p];
                                            const isSelected = priority === p;
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => {
                                                        setPriority(p);
                                                        setShowPriorityDropdown(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-slate-50 text-left ${
                                                        isSelected ? 'bg-violet-50/50 text-[#6D5EF5]' : 'text-slate-600'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                                                        <span>{meta.label}</span>
                                                    </div>
                                                    {isSelected && <Check size={12} weight="bold" className="text-[#6D5EF5]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Trạng thái</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowStatusDropdown(!showStatusDropdown);
                                    setShowPriorityDropdown(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 focus:border-[#6D5EF5] rounded-xl outline-none text-xs font-semibold text-slate-700 transition-all text-left shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${STATUS_META[status]?.dotColor}`} />
                                    <span>{STATUS_META[status]?.label || 'Chọn'}</span>
                                </div>
                                <CaretDown size={14} weight="bold" className={`text-slate-400 transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showStatusDropdown && (() => {
                                const isFutureSession = (() => {
                                    if (type !== 'SESSION' || !startTime) return false;
                                    const refDate = new Date(startTime);
                                    const todayStr = getLocalDateStr(new Date());
                                    const refStr = getLocalDateStr(refDate);
                                    return refStr > todayStr;
                                })();
                                return (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-[210]" 
                                            onClick={() => setShowStatusDropdown(false)}
                                        />
                                        <div className="absolute left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.06)] rounded-xl p-1.5 z-[220] flex flex-col gap-1 animate-in fade-in slide-in-from-top-1.5 duration-100">
                                            {Object.entries(STATUS_META)
                                                .filter(([key]) => key !== 'skipped')
                                                .map(([key, meta]) => {
                                                    const isSelected = status === key;
                                                    const isDisabled = key === 'done' && isFutureSession;
                                                    return (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() => {
                                                                setStatus(key);
                                                                setShowStatusDropdown(false);
                                                            }}
                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                                                                isDisabled 
                                                                    ? 'opacity-40 cursor-not-allowed bg-slate-50/50 text-slate-400'
                                                                    : isSelected 
                                                                        ? 'bg-violet-50/50 text-[#6D5EF5] hover:bg-violet-50' 
                                                                        : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                                                                <span>{meta.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isDisabled && <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Tương lai</span>}
                                                                {isSelected && <Check size={12} weight="bold" className="text-[#6D5EF5]" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {error && (
                        <div className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-medium text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                        <button type="submit" disabled={!title.trim() || saving}
                            className="flex-[2] py-3 bg-gradient-to-r from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white rounded-xl font-semibold text-sm shadow-md shadow-violet-500/15 disabled:opacity-50 transition-all active:scale-[0.98]">
                            {saving ? 'Đang tạo...' : 'Tạo công việc'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GoalsPage() {
    const { data: categories = [], isLoading: lCat } = useSchedulerCategories();
    const { data: tasks = [], isLoading: lTask } = useSchedulerTasks();

    const createCategory = useCreateCategory();
    const createTask = useCreateTask();

    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();

    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterTime, setFilterTime] = useState<'all' | 'today' | 'tomorrow' | 'dayafter' | 'custom'>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [activeCustomStart, setActiveCustomStart] = useState('');
    const [activeCustomEnd, setActiveCustomEnd] = useState('');
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [inlineCategory, setInlineCategory] = useState<string | null>(null);


    // Category modal
    const [catModal, setCatModal] = useState(false);
    const [catName, setCatName] = useState('');
    const [catErr, setCatErr] = useState('');

    const [editCatId, setEditCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

    // Task modal
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState('');
    const [editTaskDueTime, setEditTaskDueTime] = useState('');
    const [editTaskPriority, setEditTaskPriority] = useState(2);
    const [editTaskStatus, setEditTaskStatus] = useState('pending');
    const [editTaskType, setEditTaskType] = useState<'TASK' | 'SESSION'>('TASK');
    const [editTaskStartTime, setEditTaskStartTime] = useState('');
    const [editTaskEndTime, setEditTaskEndTime] = useState('');
    const [taskErr, setTaskErr] = useState('');

    const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // AI Modal
    const [aiModalOpen, setAiModalOpen] = useState(false);

    // Handlers
    const handleCreateCat = async (e: React.FormEvent) => {
        e.preventDefault(); if (!catName.trim()) return;
        setCatErr('');
        try { await createCategory.mutateAsync({ name: catName.trim() }); setCatName(''); setCatModal(false); }
        catch { setCatErr('Tạo danh mục thất bại. Thử lại.'); }
    };

    const handleEditCat = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editCatName.trim() || !editCatId) return;
        setCatErr('');
        try { await updateCategory.mutateAsync({ id: editCatId, data: { name: editCatName.trim() } }); setEditCatId(null); }
        catch { setCatErr('Cập nhật thất bại. Thử lại.'); }
    };

    const handleDeleteCat = async () => {
        if (!deleteCatId) return;
        setCatErr('');
        try { await deleteCategory.mutateAsync(deleteCatId); setDeleteCatId(null); }
        catch { setCatErr('Xóa thất bại. Thử lại.'); }
    };

    const handleEditTask = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editTaskTitle.trim() || !editTaskId) return;
        setTaskErr('');

        if (editTaskType === 'SESSION') {
            if (!editTaskStartTime || !editTaskEndTime) {
                setTaskErr('Vui lòng chọn thời gian bắt đầu và kết thúc.');
                return;
            }
            const sDate = new Date(editTaskStartTime);
            const eDate = new Date(editTaskEndTime);
            if (sDate >= eDate) {
                setTaskErr('Thời gian kết thúc phải sau thời gian bắt đầu.');
                return;
            }
            if (sDate.toDateString() !== eDate.toDateString()) {
                setTaskErr('Thời gian bắt đầu và phiên kết thúc phải trong cùng một ngày.');
                return;
            }
            // Check if marking a future session as completed (done)
            if (editTaskStatus === 'done') {
                const todayStr = getLocalDateStr(new Date());
                const refStr = getLocalDateStr(sDate);
                if (refStr > todayStr) {
                    setTaskErr('Không thể đánh dấu hoàn thành phiên học trong tương lai.');
                    return;
                }
            }
        }

        try {
            if (editTaskType === 'SESSION') {
                await updateTask.mutateAsync({
                    id: editTaskId,
                    data: {
                        title: editTaskTitle.trim(),
                        priority: editTaskPriority,
                        status: editTaskStatus,
                        type: 'SESSION',
                        sessionData: {
                            startTime: new Date(editTaskStartTime).toISOString(),
                            endTime: new Date(editTaskEndTime).toISOString(),
                        }
                    }
                });
            } else {
                await updateTask.mutateAsync({
                    id: editTaskId,
                    data: {
                        title: editTaskTitle.trim(),
                        priority: editTaskPriority,
                        status: editTaskStatus,
                        type: 'TASK',
                        dueTime: editTaskDueTime ? new Date(editTaskDueTime).toISOString() : null,
                    }
                });
            }
            setEditTaskId(null);
        }
        catch (err) {
            const error = err as { response?: { data?: { message?: string | string[] } } };
            const msg = error.response?.data?.message || 'Cập nhật công việc thất bại. Thử lại.';
            setTaskErr(Array.isArray(msg) ? msg[0] : msg);
        }
    };

    const handleDeleteTask = async () => {
        if (!deleteTaskId) return;
        setTaskErr('');
        try { 
            await deleteTask.mutateAsync({ id: deleteTaskId }); 
            setDeleteTaskId(null); 
        } catch (err) { 
            const error = err as { response?: { data?: { message?: string | string[] } } };
            const msg = error.response?.data?.message || 'Xóa công việc thất bại. Thử lại.';
            setTaskErr(Array.isArray(msg) ? msg[0] : msg); 
        }
    };

    const handleInlineSave = async (d: {
        title: string;
        categoryId: string;
        dueTime?: string;
        priority?: number;
        status?: string;
        type?: 'TASK' | 'SESSION';
        sessionData?: { startTime: string; endTime: string };
    }) => {
        await createTask.mutateAsync(d);
        setInlineCategory(null);
    };

    const organized = useMemo(() => {
        const q = search.toLowerCase();
        const now = new Date();
        const todayStr = getLocalDateStr(now);
        const tomorrowDate = new Date(now); tomorrowDate.setDate(now.getDate() + 1);
        const tomorrowStr = getLocalDateStr(tomorrowDate);
        const dayAfterDate = new Date(now); dayAfterDate.setDate(now.getDate() + 2);
        const dayAfterStr = getLocalDateStr(dayAfterDate);

        const matchesTime = (t: Task): boolean => {
            if (filterTime === 'all') return true;
            // For SESSIONs, use startTime from first allocation; for TASKs, use dueTime
            const refDate = t.allocations && t.allocations.length > 0
                ? new Date(t.allocations[0].startTime)
                : t.dueTime ? new Date(t.dueTime) : null;
            if (!refDate) return false; // no date → only shown under 'all' (already returned above)
            const refStr = getLocalDateStr(refDate);
            if (filterTime === 'today') return refStr === todayStr;
            if (filterTime === 'tomorrow') return refStr === tomorrowStr;
            if (filterTime === 'dayafter') return refStr === dayAfterStr;
            if (filterTime === 'custom') {
                if (!activeCustomStart && !activeCustomEnd) return true;
                if (activeCustomStart && !activeCustomEnd) return refStr >= activeCustomStart;
                if (!activeCustomStart && activeCustomEnd) return refStr <= activeCustomEnd;
                return refStr >= activeCustomStart && refStr <= activeCustomEnd;
            }
            return true;
        };

        return (categories as Category[]).map((cat, idx) => ({
            ...cat, palette: PALETTE[idx % PALETTE.length],
            tasks: (tasks as Task[]).filter(t => {
                if (t.categoryId !== cat.id) return false;
                if (filterStatus !== 'all' && t.status !== filterStatus) return false;
                if (!matchesTime(t)) return false;
                if (q && !t.title.toLowerCase().includes(q)) return false;
                return true;
            }),
        })).filter(cat => !filterCat || cat.id === filterCat);
    }, [categories, tasks, filterCat, filterStatus, filterTime, activeCustomStart, activeCustomEnd, search]);

    const totalTasks = (tasks as Task[]).length;
    const totalFilteredTasks = useMemo(() => organized.reduce((sum, cat) => sum + cat.tasks.length, 0), [organized]);

    if (lCat || lTask) return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-[3.5px] border-[#6D5EF5] border-t-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F6F7FB] -mx-4 lg:-mx-8 -my-4 lg:-my-8 px-6 lg:px-10 py-6 lg:py-8 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start w-full">

                {/* ══ Sidebar Column (DANH MỤC Card) ═══════════════════════════ */}
                <aside className="w-full lg:w-[300px] shrink-0 bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.012)] p-5 flex flex-col gap-4 self-start">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider">Danh mục</span>
                        <button 
                            onClick={() => setCatModal(true)}
                            className="text-xs font-bold text-[#6D5EF5] bg-violet-50 hover:bg-violet-100 transition-colors px-2.5 py-1.5 rounded-xl flex items-center gap-1"
                        >
                            <Plus size={12} weight="bold" /> Thêm
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* Special "Tất cả" category */}
                        <div 
                            onClick={() => setFilterCat(null)}
                            className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                                !filterCat 
                                    ? 'bg-violet-50/70 border-violet-100/50 shadow-sm text-[#6D5EF5]' 
                                    : 'border-transparent text-slate-600 hover:bg-slate-50/70 hover:text-slate-800'
                            }`}
                        >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-violet-100/60 transition-transform duration-200 group-hover:scale-105">
                                <SquaresFour weight={!filterCat ? "fill" : "duotone"} size={18} className="text-[#6D5EF5]" />
                            </div>
                            <span className="font-semibold text-xs flex-1">Tất cả công việc</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                !filterCat 
                                    ? 'bg-white border-violet-200/50 text-[#6D5EF5]' 
                                    : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-slate-500'
                            }`}>
                                {totalTasks}
                            </span>
                        </div>

                        {/* User Categories */}
                        {(categories as Category[]).map((cat, idx) => {
                            const meta = getCategoryMeta(idx);
                            const Icon = meta.icon;
                            const count = cat.tasks?.length ?? 0;
                            const isSelected = filterCat === cat.id;

                            return (
                                <div 
                                    key={cat.id}
                                    onClick={() => setFilterCat(cat.id)}
                                    className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border relative ${
                                        isSelected 
                                            ? 'bg-violet-50/70 border-violet-100/50 shadow-sm text-[#6D5EF5]' 
                                            : 'border-transparent text-slate-600 hover:bg-slate-50/70 hover:text-slate-800'
                                    }`}
                                >
                                    <div 
                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                                        style={{ backgroundColor: meta.bg }}
                                    >
                                        <Icon weight={isSelected ? "fill" : "duotone"} size={18} style={{ color: PALETTE[idx % PALETTE.length].hex || meta.color }} />
                                    </div>
                                    <span className="font-semibold text-xs flex-1 truncate pr-6">{cat.name}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                        isSelected 
                                            ? 'bg-white border-violet-200/50 text-[#6D5EF5]' 
                                            : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-slate-500'
                                    }`}>
                                        {count}
                                    </span>

                                    {/* Dropdown Options on hover */}
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100 shadow-sm z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditCatId(cat.id);
                                                setEditCatName(cat.name);
                                                setCatErr('');
                                            }}
                                            className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors"
                                        >
                                            <PencilSimple size={12} weight="bold" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteCatId(cat.id);
                                                setCatErr('');
                                            }}
                                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash size={12} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* ══ Content Column ═══════════════════════════════════════════ */}
                <main className="flex-1 min-w-0 flex flex-col gap-6 w-full animate-in fade-in duration-200">

                    {/* Topbar row */}
                    <div className="flex flex-col gap-3 pb-4 border-b border-slate-200/50">
                        {/* Row 1: Title + Search + AI Button */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Danh sách công việc</h1>
                                <p className="text-xs text-slate-450 font-medium mt-0.5">
                                    {filterCat ? (categories as Category[]).find(c => c.id === filterCat)?.name : 'Tất cả lĩnh vực học tập'}
                                    {(filterTime !== 'all' || filterStatus !== 'all') && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#6D5EF5] bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                                            <FunnelSimple size={10} weight="bold" /> Đang lọc
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Search */}
                                <div className="relative">
                                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} weight="bold" />
                                    <input 
                                        type="text" 
                                        placeholder="Tìm công việc..." 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#6D5EF5] transition-all duration-200 w-44 focus:w-52 shadow-sm"
                                    />
                                </div>

                                {/* Integrated AI Scheduler Button */}
                                <button
                                    onClick={() => setAiModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-tr from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-sm shadow-violet-500/10 active:scale-95 transition-all duration-150 shrink-0"
                                >
                                    <Sparkle size={13} weight="fill" />
                                    Lên lịch AI
                                </button>
                            </div>
                        </div>

                        {/* Row 2: Filter bar (dropdown time + dropdown status) */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Time dropdown */}
                            <div className="relative">
                                {isTimeDropdownOpen && (
                                    <div className="fixed inset-0 z-30" onClick={() => setIsTimeDropdownOpen(false)} />
                                )}
                                <button
                                    onClick={() => {
                                        setIsTimeDropdownOpen(!isTimeDropdownOpen);
                                        setIsStatusDropdownOpen(false);
                                    }}
                                    className={`relative z-35 flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border rounded-xl text-xs font-semibold text-slate-700 shadow-sm cursor-pointer transition-all duration-150 ${
                                        isTimeDropdownOpen || filterTime !== 'all' ? 'border-[#6D5EF5] text-[#6D5EF5] bg-violet-50/10' : 'border-slate-200/80'
                                    }`}
                                >
                                    <Clock size={13} className={filterTime !== 'all' ? 'text-[#6D5EF5]' : 'text-slate-400'} weight="bold" />
                                    <span>
                                        Thời gian:{' '}
                                        {filterTime === 'all' && 'Tất cả'}
                                        {filterTime === 'today' && 'Hôm nay'}
                                        {filterTime === 'tomorrow' && 'Ngày mai'}
                                        {filterTime === 'dayafter' && 'Ngày kia'}
                                        {filterTime === 'custom' && (
                                            activeCustomStart || activeCustomEnd
                                                ? `Tùy chỉnh (${activeCustomStart ? format(new Date(activeCustomStart), 'dd/MM') : ''} - ${activeCustomEnd ? format(new Date(activeCustomEnd), 'dd/MM') : ''})`
                                                : 'Tùy chỉnh'
                                        )}
                                    </span>
                                    <CaretDown size={11} className={`transition-transform duration-200 ${isTimeDropdownOpen ? 'rotate-180' : ''}`} weight="bold" />
                                </button>

                                {isTimeDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-xl py-1 z-35 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                        {([
                                            { val: 'all', label: 'Tất cả' },
                                            { val: 'today', label: 'Hôm nay' },
                                            { val: 'tomorrow', label: 'Ngày mai' },
                                            { val: 'dayafter', label: 'Ngày kia' },
                                            { val: 'custom', label: 'Tùy chỉnh' },
                                        ] as const).map(option => {
                                            const isSelected = filterTime === option.val;
                                            return (
                                                <button
                                                    key={option.val}
                                                    onClick={() => {
                                                        setFilterTime(option.val);
                                                        setIsTimeDropdownOpen(false);
                                                    }}
                                                    className={`px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 transition-all ${
                                                        isSelected ? 'text-[#6D5EF5] bg-violet-50/30' : 'text-slate-650'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Status dropdown */}
                            <div className="relative">
                                {isStatusDropdownOpen && (
                                    <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)} />
                                )}
                                <button
                                    onClick={() => {
                                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                        setIsTimeDropdownOpen(false);
                                    }}
                                    className={`relative z-35 flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border rounded-xl text-xs font-semibold text-slate-700 shadow-sm cursor-pointer transition-all duration-150 ${
                                        isStatusDropdownOpen || filterStatus !== 'all' ? 'border-[#6D5EF5] text-[#6D5EF5] bg-violet-50/10' : 'border-slate-200/80'
                                    }`}
                                >
                                    <FunnelSimple size={13} className={filterStatus !== 'all' ? 'text-[#6D5EF5]' : 'text-slate-400'} weight="bold" />
                                    <span>
                                        Trạng thái:{' '}
                                        {filterStatus === 'all' && 'Tất cả'}
                                        {filterStatus === 'pending' && 'Chờ'}
                                        {filterStatus === 'scheduled' && 'Lên lịch'}
                                        {filterStatus === 'done' && 'Xong'}
                                    </span>
                                    <CaretDown size={11} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} weight="bold" />
                                </button>

                                {isStatusDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1.5 w-40 bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-xl py-1 z-35 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                        {([
                                            { val: 'all', label: 'Tất cả' },
                                            { val: 'pending', label: 'Chờ' },
                                            { val: 'scheduled', label: 'Lên lịch' },
                                            { val: 'done', label: 'Xong' },
                                        ] as const).map(option => {
                                            const isSelected = filterStatus === option.val;
                                            return (
                                                <button
                                                    key={option.val}
                                                    onClick={() => {
                                                        setFilterStatus(option.val);
                                                        setIsStatusDropdownOpen(false);
                                                    }}
                                                    className={`px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 transition-all ${
                                                        isSelected ? 'text-[#6D5EF5] bg-violet-50/30' : 'text-slate-650'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Reset button — only shown when any filter is active */}
                            {(filterTime !== 'all' || filterStatus !== 'all' || activeCustomStart || activeCustomEnd) && (
                                <button
                                    onClick={() => {
                                        setFilterTime('all');
                                        setFilterStatus('all');
                                        setCustomStart('');
                                        setCustomEnd('');
                                        setActiveCustomStart('');
                                        setActiveCustomEnd('');
                                    }}
                                    className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#6D5EF5] transition-colors px-2 py-1.5 rounded-lg hover:bg-violet-50"
                                >
                                    <X size={11} weight="bold" /> Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        {/* Custom Date Range Panel */}
                        {filterTime === 'custom' && (
                            <div className="flex flex-wrap items-center gap-3 bg-violet-50/20 border border-violet-100/50 p-3 rounded-2xl animate-in slide-in-from-top-2 duration-200 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-[#6D5EF5]" weight="bold" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Từ ngày</span>
                                    <input 
                                        type="date" 
                                        value={customStart}
                                        onChange={e => setCustomStart(e.target.value)}
                                        className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#6D5EF5] transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-[#6D5EF5]" weight="bold" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đến ngày</span>
                                    <input 
                                        type="date" 
                                        value={customEnd}
                                        onChange={e => setCustomEnd(e.target.value)}
                                        className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#6D5EF5] transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveCustomStart(customStart);
                                        setActiveCustomEnd(customEnd);
                                    }}
                                    className="px-4 py-1.5 bg-gradient-to-r from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                                >
                                    Áp dụng
                                </button>
                                {(activeCustomStart || activeCustomEnd) && (
                                    <button
                                        onClick={() => {
                                            setCustomStart('');
                                            setCustomEnd('');
                                            setActiveCustomStart('');
                                            setActiveCustomEnd('');
                                        }}
                                        className="text-xs text-[#6D5EF5] hover:text-slate-700 font-bold transition-all px-2"
                                    >
                                        Đặt lại
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    {categories.length === 0 ? (
                        /* ── Absolutely no categories yet ── */
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.015)] py-12 px-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-6 w-full">
                            <svg width="150" height="120" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2">
                                <path d="M40 30L43 37L50 40L43 43L40 50L37 43L30 40L37 37L40 30Z" fill="#8B5CF6" opacity="0.6"/>
                                <path d="M180 40L182 45L187 47L182 49L180 54L178 49L173 47L178 45L180 40Z" fill="#6D5EF5" opacity="0.8"/>
                                <path d="M195 110L196 113L199 114L196 115L195 118L194 115L191 114L194 113L195 110Z" fill="#C084FC" opacity="0.5"/>
                                <rect x="54" y="34" width="92" height="122" rx="16" fill="#F1F0FF" />
                                <rect x="50" y="30" width="92" height="122" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
                                <rect x="78" y="20" width="36" height="14" rx="6" fill="#E2DFFF" />
                                <rect x="84" y="24" width="24" height="6" rx="3" fill="#6D5EF5" />
                                <rect x="66" y="54" width="14" height="14" rx="4" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
                                <path d="M70 61L72.5 63.5L77 58.5" stroke="#6D5EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <rect x="88" y="58" width="40" height="6" rx="3" fill="#94A3B8" opacity="0.5" />
                                <rect x="66" y="80" width="14" height="14" rx="4" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
                                <path d="M70 87L72.5 89.5L77 84.5" stroke="#6D5EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <rect x="88" y="84" width="46" height="6" rx="3" fill="#94A3B8" opacity="0.5" />
                                <rect x="66" y="106" width="14" height="14" rx="4" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
                                <path d="M70 113L72.5 115.5L77 110.5" stroke="#6D5EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <rect x="88" y="110" width="34" height="6" rx="3" fill="#94A3B8" opacity="0.5" />
                                <path d="M142 120 L158 120 L154 144 L146 144 Z" fill="#DDB7FF" />
                                <rect x="140" y="116" width="20" height="4" rx="2" fill="#8B5CF6" />
                                <path d="M150 116 Q150 90 142 84" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
                                <path d="M150 116 Q154 96 162 92" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M142 84 Q134 82 136 74 Q144 76 142 84 Z" fill="#34D399" />
                                <path d="M162 92 Q170 90 168 82 Q160 84 162 92 Z" fill="#34D399" />
                                <path d="M146 95 Q144 87 150 82 Q154 88 146 95 Z" fill="#059669"/>
                            </svg>
                            <h3 className="text-base font-bold text-slate-800 mt-3">Chưa có danh mục</h3>
                            <p className="text-xs text-slate-450 mt-1 mb-5 max-w-xs leading-normal">
                                Tạo danh mục đầu tiên của bạn để phân loại các công việc học tập.
                            </p>
                            <button 
                                onClick={() => setCatModal(true)}
                                className="px-5 py-2.5 bg-gradient-to-tr from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white font-bold rounded-xl shadow-sm text-xs transition-all duration-150 active:scale-95"
                            >
                                + Thêm danh mục
                            </button>
                        </div>
                    ) : totalFilteredTasks === 0 && (filterTime !== 'all' || filterStatus !== 'all' || search) ? (
                        /* ── Has categories but active filter yields no results ── */
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.015)] py-12 px-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-6 w-full">
                            <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                                <FunnelSimple size={28} weight="duotone" className="text-[#6D5EF5]" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Không có kết quả</h3>
                            <p className="text-xs text-slate-450 mt-1.5 mb-5 max-w-xs leading-relaxed">
                                Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại.
                                Hãy thử điều chỉnh hoặc xóa bộ lọc.
                            </p>
                            <button 
                                onClick={() => { setFilterTime('all'); setFilterStatus('all'); setSearch(''); }}
                                className="px-5 py-2.5 bg-gradient-to-tr from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white font-bold rounded-xl shadow-sm text-xs transition-all duration-150 active:scale-95"
                            >
                                Xóa toàn bộ bộ lọc
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8 w-full">
                            {organized.map((cat) => {
                                const count = cat.tasks.length;
                                return (
                                    <div key={cat.id} className="flex flex-col gap-3.5 w-full">
                                        
                                        {/* Category header row */}
                                        <div className="flex items-center gap-2.5 relative group/header pt-2 px-1">
                                            <div className="w-1.5 h-4.5 rounded-full" style={{ backgroundColor: cat.palette.hex }} />
                                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                                                {cat.name}
                                            </h2>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-500 bg-slate-100">
                                                {count} nhiệm vụ
                                            </span>

                                            <button 
                                                onClick={() => setInlineCategory(cat.id)}
                                                className="ml-auto opacity-0 group-hover/header:opacity-100 transition-opacity duration-200 px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-[11px] font-bold hover:bg-slate-100 text-[#6D5EF5]"
                                            >
                                                <Plus weight="bold" size={12} /> Thêm công việc
                                            </button>
                                        </div>

                                        {count === 0 ? (
                                            <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/20">
                                                <p className="text-xs text-slate-400 font-medium mb-3">Chưa có công việc nào trong danh mục này.</p>
                                                <button 
                                                    onClick={() => setInlineCategory(cat.id)}
                                                    className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-all duration-150 active:scale-95 border border-slate-250 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
                                                >
                                                    + Thêm công việc ngay
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2.5">
                                                {cat.tasks.map(task => {
                                                    const pm = PRIORITY_META[task.priority ?? 2] ?? PRIORITY_META[2];
                                                    const sm = STATUS_META[task.status] ?? STATUS_META.pending;
                                                    const isFutureSession = (() => {
                                                        const isSession = task.allocations && task.allocations.length > 0;
                                                        if (!isSession) return false;
                                                        const refDate = task.allocations && task.allocations.length > 0
                                                            ? new Date(task.allocations[0].startTime)
                                                            : task.dueTime ? new Date(task.dueTime) : null;
                                                        if (!refDate) return false;
                                                        const todayStr = getLocalDateStr(new Date());
                                                        const refStr = getLocalDateStr(refDate);
                                                        return refStr > todayStr;
                                                    })();

                                                    return (
                                                        <div 
                                                            key={task.id} 
                                                            className="group flex items-center justify-between gap-4 p-3.5 bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.025)] transition-all duration-200"
                                                        >
                                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                                {/* Checkbox circle/square */}
                                                                <button 
                                                                    disabled={isFutureSession}
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (isFutureSession) return;
                                                                        const nextStatus = task.status === 'done' ? 'pending' : 'done';
                                                                        await updateTask.mutateAsync({
                                                                            id: task.id,
                                                                            data: { status: nextStatus }
                                                                        });
                                                                    }}
                                                                    title={isFutureSession ? 'Không thể đánh dấu hoàn thành phiên học trong tương lai' : undefined}
                                                                    className={`w-5 h-5 border-2 rounded-lg transition-all duration-150 flex items-center justify-center shrink-0 ${
                                                                        task.status === 'done' 
                                                                            ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/10' 
                                                                            : isFutureSession
                                                                                ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                                                                                : 'border-slate-300 hover:border-violet-500 bg-white cursor-pointer'
                                                                    }`}
                                                                >
                                                                    {task.status === 'done' && <Check size={12} weight="bold" className="text-white" />}
                                                                </button>

                                                                {/* Title & Metadata row */}
                                                                <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                                    <span className={`text-[13px] font-semibold tracking-tight transition-colors duration-150 truncate ${
                                                                        task.status === 'done' 
                                                                            ? 'line-through text-slate-400 font-normal' 
                                                                            : 'text-slate-750 group-hover:text-slate-900'
                                                                    }`}>
                                                                        {task.title}
                                                                    </span>

                                                                    {/* Metadata Tags */}
                                                                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                                                                        {/* Due date */}
                                                                        {task.dueTime && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg">
                                                                                <CalendarBlank size={12} className="text-slate-450" />
                                                                                {format(new Date(task.dueTime), 'dd MMM, HH:mm', { locale: vi })}
                                                                            </span>
                                                                        )}

                                                                        {/* Priority badge with status dot */}
                                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold border ${pm.bg} ${pm.border} ${pm.color}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${pm.dotColor}`} />
                                                                            {pm.label}
                                                                        </span>

                                                                        {/* Status badge with status dot */}
                                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold border ${sm.bg} ${sm.border} ${sm.color}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dotColor}`} />
                                                                            {sm.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Actions block */}
                                                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setEditTaskId(task.id);
                                                                        setEditTaskTitle(task.title);
                                                                        
                                                                        const isSession = task.allocations && task.allocations.length > 0;
                                                                        setEditTaskType(isSession ? 'SESSION' : 'TASK');

                                                                        if (task.dueTime) {
                                                                            const d = new Date(task.dueTime);
                                                                            const ds = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                                            setEditTaskDueTime(ds);
                                                                        } else {
                                                                            setEditTaskDueTime('');
                                                                        }

                                                                        if (isSession && task.allocations && task.allocations.length > 0) {
                                                                            const alloc = task.allocations[0];
                                                                            const sD = new Date(alloc.startTime);
                                                                            const sDs = new Date(sD.getTime() - sD.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                                            setEditTaskStartTime(sDs);

                                                                            const eD = new Date(alloc.endTime);
                                                                            const eDs = new Date(eD.getTime() - eD.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                                            setEditTaskEndTime(eDs);
                                                                        } else {
                                                                            setEditTaskStartTime('');
                                                                            setEditTaskEndTime('');
                                                                        }

                                                                        setEditTaskPriority(task.priority ?? 2);
                                                                        setEditTaskStatus(task.status);
                                                                        setTaskErr('');
                                                                        setShowPriorityDropdown(false);
                                                                        setShowStatusDropdown(false);
                                                                    }}
                                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                                >
                                                                    <PencilSimple size={14} weight="bold" />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.preventDefault(); 
                                                                        setDeleteTaskId(task.id); 
                                                                        setTaskErr(''); 
                                                                    }}
                                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <Trash size={14} weight="bold" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* ══ Modal: Category Create ════════════════════════════════════════════ */}
            {catModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setCatModal(false); setCatErr(''); setCatName(''); } }}>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-7 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Danh mục mới</h2>
                                <p className="text-xs text-slate-405 mt-0.5">Tạo nhóm học tập của bạn</p>
                            </div>
                            <button onClick={() => { setCatModal(false); setCatErr(''); setCatName(''); }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-404 transition-colors">
                                <X size={18} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCat} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tên danh mục</label>
                                <input autoFocus type="text" value={catName}
                                    onChange={e => { setCatName(e.target.value); setCatErr(''); }}
                                    placeholder="VD: Kinh tế, Lịch sử, Toán học..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-800 transition-all"
                                />
                                {catErr && <p className="text-xs text-red-500 font-semibold mt-2">{catErr}</p>}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setCatModal(false); setCatName(''); }}
                                    className="flex-1 py-3 rounded-xl font-medium text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                <button type="submit" disabled={!catName.trim() || createCategory.isPending}
                                    className="flex-[2] py-3 bg-gradient-to-r from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white rounded-xl font-semibold text-sm shadow-md shadow-violet-500/15 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {createCategory.isPending ? 'Đang tạo...' : 'Tạo danh mục'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Edit Category ════════════════════════════════════════════ */}
            {editCatId !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setEditCatId(null); setCatErr(''); } }}>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-7 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-850">Sửa danh mục</h2>
                            </div>
                            <button onClick={() => { setEditCatId(null); setCatErr(''); }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                <X size={18} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleEditCat} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-405 uppercase tracking-wider mb-2">Tên danh mục</label>
                                <input autoFocus type="text" value={editCatName}
                                    onChange={e => { setEditCatName(e.target.value); setCatErr(''); }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-800 transition-all"
                                />
                                {catErr && <p className="text-xs text-red-500 font-semibold mt-2">{catErr}</p>}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setEditCatId(null); }}
                                    className="flex-1 py-3 rounded-xl font-medium text-sm text-slate-505 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                <button type="submit" disabled={!editCatName.trim() || updateCategory.isPending}
                                    className="flex-[2] py-3 bg-gradient-to-r from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white rounded-xl font-semibold text-sm shadow-md shadow-violet-500/15 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {updateCategory.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Delete Category ════════════════════════════════════════════ */}
            {deleteCatId !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setDeleteCatId(null); setCatErr(''); } }}>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-7 animate-in zoom-in-95 duration-150 text-center">
                        <div className="w-14 h-14 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash size={24} weight="duotone" />
                        </div>
                        <h2 className="text-base font-bold text-slate-800 mb-1.5">Xóa danh mục?</h2>
                        <p className="text-xs text-slate-450 mb-6 leading-relaxed px-2">
                            Các môn học và công việc thuộc danh mục này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
                        </p>
                        {catErr && <p className="text-xs text-red-500 font-semibold mb-4">{catErr}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteCatId(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                            <button onClick={handleDeleteCat} disabled={deleteCategory.isPending}
                                className="flex-[2] py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-red-200/20 disabled:opacity-50 transition-all active:scale-[0.98]">
                                {deleteCategory.isPending ? 'Đang xóa...' : 'Xóa danh mục'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Modal: Edit Task ════════════════════════════════════════════ */}
            {editTaskId !== null && (() => {
                const isFutureSessionEdit = (() => {
                    if (editTaskType !== 'SESSION' || !editTaskStartTime) return false;
                    const refDate = new Date(editTaskStartTime);
                    const todayStr = getLocalDateStr(new Date());
                    const refStr = getLocalDateStr(refDate);
                    return refStr > todayStr;
                })();
                return (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                        onClick={e => { if (e.target === e.currentTarget) { setEditTaskId(null); setTaskErr(''); } }}>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-7 animate-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Cập nhật thông tin</h2>
                                </div>
                                <button onClick={() => { setEditTaskId(null); setTaskErr(''); }}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                    <X size={18} weight="bold" />
                                </button>
                            </div>
                            <form onSubmit={handleEditTask} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tên công việc</label>
                                    <input autoFocus type="text" value={editTaskTitle}
                                        onChange={e => { setEditTaskTitle(e.target.value); setTaskErr(''); }}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-800 transition-all"
                                    />
                                </div>

                                {/* Segmented Control for Type Selector */}
                                <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl my-4">
                                    <button
                                        type="button"
                                        onClick={() => { setEditTaskType('TASK'); setTaskErr(''); }}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${editTaskType === 'TASK' ? 'bg-white text-[#6D5EF5] shadow-sm border border-slate-100' : 'text-slate-505 hover:text-slate-700'}`}
                                    >
                                        <GraduationCap weight="bold" size={15} />
                                        Công việc thường
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditTaskType('SESSION'); setTaskErr(''); }}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${editTaskType === 'SESSION' ? 'bg-white text-[#6D5EF5] shadow-sm border border-slate-100' : 'text-slate-505 hover:text-slate-700'}`}
                                    >
                                        <Sparkle weight="bold" size={15} />
                                        Phiên học (Khóa lịch)
                                    </button>
                                </div>

                                {editTaskType === 'TASK' ? (
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Hạn chót</label>
                                        <input type="datetime-local" value={editTaskDueTime}
                                            onChange={e => setEditTaskDueTime(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-750 transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Bắt đầu</label>
                                            <input type="datetime-local" value={editTaskStartTime}
                                                onChange={e => { setEditTaskStartTime(e.target.value); setTaskErr(''); }}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-755 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Kết thúc</label>
                                            <input type="datetime-local" value={editTaskEndTime}
                                                onChange={e => { setEditTaskEndTime(e.target.value); setTaskErr(''); }}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-755 transition-all"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Độ ưu tiên</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPriorityDropdown(!showPriorityDropdown);
                                                setShowStatusDropdown(false);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 focus:border-[#6D5EF5] rounded-xl outline-none text-xs font-semibold text-slate-700 transition-all text-left shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${PRIORITY_META[editTaskPriority]?.dotColor}`} />
                                                <span>{PRIORITY_META[editTaskPriority]?.label || 'Chọn'}</span>
                                            </div>
                                            <CaretDown size={14} weight="bold" className={`text-slate-400 transition-transform duration-200 ${showPriorityDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showPriorityDropdown && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-[210]" 
                                                    onClick={() => setShowPriorityDropdown(false)}
                                                />
                                                <div className="absolute left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.06)] rounded-xl p-1.5 z-[220] flex flex-col gap-1 animate-in fade-in slide-in-from-top-1.5 duration-100">
                                                    {[1, 2, 3, 4].map((p) => {
                                                        const meta = PRIORITY_META[p];
                                                        const isSelected = editTaskPriority === p;
                                                        return (
                                                            <button
                                                                key={p}
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditTaskPriority(p);
                                                                    setShowPriorityDropdown(false);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-slate-50 text-left ${
                                                                    isSelected ? 'bg-violet-50/50 text-[#6D5EF5]' : 'text-slate-600'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                                                                    <span>{meta.label}</span>
                                                                </div>
                                                                {isSelected && <Check size={12} weight="bold" className="text-[#6D5EF5]" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Trạng thái</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowStatusDropdown(!showStatusDropdown);
                                                setShowPriorityDropdown(false);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 focus:border-[#6D5EF5] rounded-xl outline-none text-xs font-semibold text-slate-700 transition-all text-left shadow-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${STATUS_META[editTaskStatus]?.dotColor}`} />
                                                <span>{STATUS_META[editTaskStatus]?.label || 'Chọn'}</span>
                                            </div>
                                            <CaretDown size={14} weight="bold" className={`text-slate-400 transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showStatusDropdown && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-[210]" 
                                                    onClick={() => setShowStatusDropdown(false)}
                                                />
                                                <div className="absolute left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.06)] rounded-xl p-1.5 z-[220] flex flex-col gap-1 animate-in fade-in slide-in-from-top-1.5 duration-100">
                                                    {Object.entries(STATUS_META)
                                                        .filter(([key]) => key !== 'skipped')
                                                        .map(([key, meta]) => {
                                                            const isSelected = editTaskStatus === key;
                                                        const isDisabled = key === 'done' && isFutureSessionEdit;
                                                        return (
                                                            <button
                                                                key={key}
                                                                type="button"
                                                                disabled={isDisabled}
                                                                onClick={() => {
                                                                    setEditTaskStatus(key);
                                                                    setShowStatusDropdown(false);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                                                                    isDisabled 
                                                                        ? 'opacity-40 cursor-not-allowed bg-slate-50/50 text-slate-400'
                                                                        : isSelected 
                                                                            ? 'bg-violet-50/50 text-[#6D5EF5] hover:bg-violet-50' 
                                                                            : 'text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                                                                    <span>{meta.label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {isDisabled && <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Tương lai</span>}
                                                                    {isSelected && <Check size={12} weight="bold" className="text-[#6D5EF5]" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {taskErr && <p className="text-xs text-red-500 font-semibold mt-2">{taskErr}</p>}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setEditTaskId(null); }}
                                        className="flex-1 py-3 rounded-xl font-medium text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                    <button type="submit" disabled={!editTaskTitle.trim() || updateTask.isPending}
                                        className="flex-[2] py-3 bg-gradient-to-r from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white rounded-xl font-semibold text-sm shadow-md shadow-violet-500/15 disabled:opacity-50 transition-all active:scale-[0.98]">
                                        {updateTask.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* ══ Modal: Delete Task ════════════════════════════════════════════ */}
            {deleteTaskId !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setDeleteTaskId(null); setTaskErr(''); } }}>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-7 animate-in zoom-in-95 duration-150 text-center">
                        <div className="w-14 h-14 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash size={24} weight="duotone" />
                        </div>
                        <h2 className="text-base font-bold text-slate-800 mb-1.5">Xóa công việc?</h2>
                        <p className="text-xs text-slate-450 mb-6 leading-relaxed px-2">
                            Công việc này sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.
                        </p>
                        {taskErr && <p className="text-xs text-red-500 font-semibold mb-4">{taskErr}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTaskId(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                            <button onClick={handleDeleteTask} disabled={deleteTask.isPending}
                                className="flex-[2] py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-red-200/20 disabled:opacity-50 transition-all active:scale-[0.98]">
                                {deleteTask.isPending ? 'Đang xóa...' : 'Xóa công việc'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ══ AI Modal ════════════════════════════════════════════ */}
            {aiModalOpen && (
                <AiScheduleModal
                    onClose={() => setAiModalOpen(false)}
                    onSuccess={() => { setAiModalOpen(false); }}
                />
            )}

            {/* ══ Create Task Modal ════════════════════════════════════════════ */}
            {inlineCategory && (
                <CreateTaskModal
                    categoryId={inlineCategory}
                    onClose={() => setInlineCategory(null)}
                    onSave={handleInlineSave}
                />
            )}
        </div>
    );
}
