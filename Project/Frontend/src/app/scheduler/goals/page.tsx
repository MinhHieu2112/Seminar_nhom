'use client';

import React, { useState, useMemo } from 'react';
import {
    Plus, X, GraduationCap, Check,
    MagnifyingGlass, Sparkle,
    PencilSimple, Trash, CalendarBlank,
    SquaresFour, MathOperations, Atom, Flask,
    BookOpen, Code} from '@phosphor-icons/react';
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
        type?: 'TASK' | 'SESSION';
        sessionData?: { startTime: string; endTime: string };
    }) => Promise<void>;
}) {
    const [title, setTitle] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState(2);
    const [type, setType] = useState<'TASK' | 'SESSION'>('TASK');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

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
                await onSave({
                    title: title.trim(),
                    categoryId,
                    priority,
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

                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Độ ưu tiên</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map(p => {
                                const pm = PRIORITY_META[p];
                                const isSelected = priority === p;
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                                            isSelected 
                                                ? 'border-[#6D5EF5] bg-violet-50/50 text-[#6D5EF5] shadow-[0_2px_12px_rgba(109,94,245,0.08)]' 
                                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {pm.label}
                                    </button>
                                );
                            })}
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
        type?: 'TASK' | 'SESSION';
        sessionData?: { startTime: string; endTime: string };
    }) => {
        await createTask.mutateAsync(d);
        setInlineCategory(null);
    };

    const organized = useMemo(() => {
        const q = search.toLowerCase();
        return (categories as Category[]).map((cat, idx) => ({
            ...cat, palette: PALETTE[idx % PALETTE.length],
            tasks: (tasks as Task[]).filter(t => {
                if (t.categoryId !== cat.id) return false;
                if (filterStatus !== 'all' && t.status !== filterStatus) return false;
                if (q && !t.title.toLowerCase().includes(q)) return false;
                return true;
            }),
        })).filter(cat => !filterCat || cat.id === filterCat);
    }, [categories, tasks, filterCat, filterStatus, search]);

    const totalTasks = (tasks as Task[]).length;

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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/50">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Danh sách công việc</h1>
                            <p className="text-xs text-slate-450 font-medium mt-0.5">
                                {filterCat ? (categories as Category[]).find(c => c.id === filterCat)?.name : 'Tất cả lĩnh vực học tập'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
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

                            {/* Status filter */}
                            <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200/40 rounded-xl p-0.5 shadow-inner">
                                {[
                                    { val: 'all', label: 'Tất cả' },
                                    { val: 'pending', label: 'Chờ' },
                                    { val: 'scheduled', label: 'Lên lịch' },
                                    { val: 'done', label: 'Xong' },
                                ].map(f => (
                                    <button 
                                        key={f.val} 
                                        onClick={() => setFilterStatus(f.val)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-155 ${
                                            filterStatus === f.val 
                                                ? 'bg-white text-[#6D5EF5] shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
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

                    {/* Content Section */}
                    {organized.length === 0 ? (
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.015)] py-12 px-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-6 w-full">
                            {/* Inline checklist SVG - smaller size */}
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

                            <h3 className="text-base font-bold text-slate-800 mt-3">Chưa có dữ liệu</h3>
                            <p className="text-xs text-slate-450 mt-1 mb-5 max-w-xs leading-normal">
                                {categories.length === 0 
                                    ? "Tạo danh mục đầu tiên của bạn để phân loại các công việc học tập." 
                                    : "Bắt đầu tạo nhiệm vụ đầu tiên của bạn trong danh mục này."
                                }
                            </p>
                            <button 
                                onClick={() => categories.length === 0 ? setCatModal(true) : setInlineCategory(categories[0].id)}
                                className="px-5 py-2.5 bg-gradient-to-tr from-[#6D5EF5] to-[#8B5CF6] hover:opacity-95 text-white font-bold rounded-xl shadow-sm text-xs transition-all duration-150 active:scale-95"
                            >
                                {categories.length === 0 ? "+ Thêm danh mục" : "+ Thêm công việc"}
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
                                                    return (
                                                        <div 
                                                            key={task.id} 
                                                            className="group flex items-center justify-between gap-4 p-3.5 bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.025)] transition-all duration-200"
                                                        >
                                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                                {/* Checkbox circle/square */}
                                                                <button 
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        const nextStatus = task.status === 'done' ? 'pending' : 'done';
                                                                        await updateTask.mutateAsync({
                                                                            id: task.id,
                                                                            data: { status: nextStatus }
                                                                        });
                                                                    }}
                                                                    className={`w-5 h-5 border-2 rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center shrink-0 ${
                                                                        task.status === 'done' 
                                                                            ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/10' 
                                                                            : 'border-slate-300 hover:border-violet-500 bg-white'
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
                                                                    }}
                                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                                >
                                                                    <PencilSimple size={14} weight="bold" />
                                                                </button>
                                                                {task.status !== 'done' && !(task.dueTime && new Date(task.dueTime) < new Date()) && (
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
                                                                )}
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
            {editTaskId !== null && (
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

                            <div>
                                <label className="block text-[10px] font-semibold text-slate-405 uppercase tracking-wider mb-2">Độ ưu tiên</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map((p) => {
                                        const meta = PRIORITY_META[p];
                                        const isSelected = editTaskPriority === p;
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setEditTaskPriority(p)}
                                                className={`py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                                                    isSelected 
                                                        ? 'border-[#6D5EF5] bg-violet-50/50 text-[#6D5EF5] shadow-sm' 
                                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                                }`}
                                            >
                                                {meta.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Trạng thái</label>
                                <select value={editTaskStatus} onChange={e => setEditTaskStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#6D5EF5] focus:bg-white rounded-xl outline-none text-sm font-medium text-slate-750 transition-all">
                                    <option value="pending">Chờ</option>
                                    <option value="scheduled">Đã lên lịch</option>
                                    <option value="done">Hoàn thành</option>
                                    <option value="skipped">Bỏ qua</option>
                                </select>
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
            )}

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
