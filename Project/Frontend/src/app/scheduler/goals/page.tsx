'use client';

import React, { useState, useMemo } from 'react';
import {
    Plus, Folder, X, GraduationCap, Check,
    MagnifyingGlass, Sparkle,
    PencilSimple, Trash
} from '@phosphor-icons/react';
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
    { hex: '#6366F1', light: '#eef2ff', dark: '#4338CA' }, // indigo
    { hex: '#EC4899', light: '#fdf2f8', dark: '#BE185D' }, // pink
    { hex: '#8B5CF6', light: '#f5f3ff', dark: '#6D28D9' }, // violet
    { hex: '#10B981', light: '#ecfdf5', dark: '#047857' }, // emerald
    { hex: '#F59E0B', light: '#fffbeb', dark: '#B45309' }, // amber
    { hex: '#3B82F6', light: '#eff6ff', dark: '#1D4ED8' }, // blue
];

const PRIORITY_META: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Thấp', color: 'text-slate-500', bg: 'bg-slate-100' },
    2: { label: 'Bình thường', color: 'text-blue-600', bg: 'bg-blue-50' },
    3: { label: 'Cao', color: 'text-orange-600', bg: 'bg-orange-50' },
    4: { label: 'Rất cao', color: 'text-red-600', bg: 'bg-red-50' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Chờ', color: 'text-amber-700', bg: 'bg-amber-50' },
    scheduled: { label: 'Đã lên lịch', color: 'text-indigo-700', bg: 'bg-indigo-50' },
    done: { label: 'Hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    skipped: { label: 'Bỏ qua', color: 'text-slate-500', bg: 'bg-slate-100' },
};

// ─── Inline Add-Task Row ──────────────────────────────────────────────────────

function CreateTaskModal({ categoryId, prefill, onClose, onSave }: {
    categoryId: string;
    prefill?: {
        title: string;
        priority?: number;
        type?: 'TASK' | 'SESSION';
        dueTime?: string;
        startTime?: string;
        endTime?: string;
    };
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
    const [title, setTitle] = useState(prefill?.title || '');
    const [dueTime, setDueTime] = useState(prefill?.dueTime || '');
    const [priority, setPriority] = useState(prefill?.priority || 2);
    const [type, setType] = useState<'TASK' | 'SESSION'>(prefill?.type || 'TASK');
    const [startTime, setStartTime] = useState(prefill?.startTime || '');
    const [endTime, setEndTime] = useState(prefill?.endTime || '');
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
                setError('Thời gian bắt đầu và kết thúc của phiên học phải trong cùng một ngày.');
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-[22px] font-black text-slate-900">Thêm công việc mới</h2>
                        <p className="text-[13px] text-slate-400 mt-0.5">Tạo công việc thường hoặc khóa lịch học tập</p>
                    </div>
                    <button onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Segmented type selector */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                    <button
                        type="button"
                        onClick={() => { setType('TASK'); setError(''); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'TASK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <GraduationCap weight="bold" size={16} />
                        Công việc thường
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('SESSION'); setError(''); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'SESSION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Sparkle weight="bold" size={16} />
                        Phiên học (Khóa lịch)
                    </button>
                </div>

                <form onSubmit={save} className="space-y-5">
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên công việc</label>
                        <input autoFocus type="text" value={title}
                            onChange={e => { setTitle(e.target.value); setError(''); }}
                            placeholder={type === 'TASK' ? "VD: Làm bài tập toán cao cấp, viết báo cáo..." : "VD: Học chương 1 toán cao cấp, ôn tập từ vựng..."}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[15px] font-bold text-slate-800 transition-all"
                        />
                    </div>

                    {type === 'TASK' ? (
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Hạn chót</label>
                            <input type="datetime-local" value={dueTime} onChange={e => setDueTime(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Thời gian bắt đầu</label>
                                <input type="datetime-local" value={startTime} onChange={e => { setStartTime(e.target.value); setError(''); }}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Thời gian kết thúc</label>
                                <input type="datetime-local" value={endTime} onChange={e => { setEndTime(e.target.value); setError(''); }}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Mức độ ưu tiên</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map(p => {
                                const pm = PRIORITY_META[p];
                                const isSelected = priority === p;
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`py-3 px-1 rounded-xl text-xs font-bold transition-all border ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {pm.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="text-[12px] text-red-500 font-semibold bg-red-50/50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                        <button type="submit" disabled={!title.trim() || saving}
                            className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                            {saving ? 'Đang tạo...' : '✦ Tạo công việc'}
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
                setTaskErr('Thời gian bắt đầu và kết thúc của phiên học phải trong cùng một ngày.');
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

    // ── Derived data ──────────────────────────────────────────────────────────

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
    const doneTasks = (tasks as Task[]).filter(t => t.status === 'done').length;

    if (lCat || lTask) return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-500 border-t-transparent" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 -m-4 lg:-m-8 font-sans">

            {/* ══ Sidebar ══════════════════════════════════════════════════════ */}
            <aside className="w-64 shrink-0 border-r border-slate-200/70 bg-white flex flex-col py-6 sticky top-0 h-screen overflow-y-auto shadow-sm">

                {/* Stats pill */}
                {totalTasks > 0 && (
                    <div className="mx-4 mb-5 p-3 bg-indigo-50 rounded-2xl">
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tiến độ</p>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-indigo-600">{doneTasks}</span>
                            <span className="text-[13px] text-indigo-400 font-semibold mb-0.5">/ {totalTasks} task</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                style={{ width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : '0%' }} />
                        </div>
                    </div>
                )}

                {/* All */}
                <button
                    onClick={() => setFilterCat(null)}
                    className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-[14px] font-bold transition-all ${!filterCat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <span className={`w-2 h-2 rounded-full ${!filterCat ? 'bg-white' : 'bg-slate-300'}`} />
                    Tất cả
                    <span className={`ml-auto text-[11px] font-black px-2 py-0.5 rounded-full ${!filterCat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {totalTasks}
                    </span>
                </button>

                {/* Category list */}
                <div className="mt-5 px-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                            <Folder weight="bold" size={11} /> Danh mục
                        </span>
                        <button onClick={() => setCatModal(true)}
                            className="text-[11px] font-black text-indigo-500 hover:text-indigo-700 transition-colors">
                            + Thêm
                        </button>
                    </div>
                    <nav className="space-y-1">
                        {(categories as Category[]).map((cat, idx) => {
                            const p = PALETTE[idx % PALETTE.length];
                            const isActive = filterCat === cat.id;
                            const count = (tasks as Task[]).filter(t => t.categoryId === cat.id).length;
                            return (
                                <div key={cat.id}
                                    className={`group flex items-center w-full px-1.5 py-1.5 rounded-xl transition-all ${isActive ? 'text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
                                    style={isActive ? { background: p.hex } : {}}
                                >
                                    <button
                                        onClick={() => setFilterCat(cat.id)}
                                        className="flex items-center gap-3 flex-1 overflow-hidden px-1.5 py-1 text-[14px] font-bold"
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.6)' : p.hex }} />
                                        <span className="truncate">{cat.name}</span>
                                    </button>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setEditCatId(cat.id); setEditCatName(cat.name); }}
                                            className={`p-1 rounded-md ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'}`}>
                                            <PencilSimple size={14} weight="bold" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteCatId(cat.id); }}
                                            className={`p-1 rounded-md ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-red-100 text-red-500'}`}>
                                            <Trash size={14} weight="bold" />
                                        </button>
                                    </div>
                                    <span className={`ml-1 mr-1 text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 group-hover:hidden ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* ══ Main ═══════════════════════════════════════════════════════ */}
            <main className="flex-1 min-w-0 overflow-auto">

                {/* ── Topbar ─────────────────────────────────────────────── */}
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-8 py-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Danh sách công việc</h1>
                        <p className="text-[13px] text-slate-400 font-medium mt-0.5">
                            {filterCat ? (categories as Category[]).find(c => c.id === filterCat)?.name : 'Tất cả lĩnh vực học tập'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} weight="bold" />
                            <input type="text" placeholder="Tìm công việc..." value={search} onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-[14px] font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-300 transition-all w-44 focus:w-56"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                            {[
                                { val: 'all', label: 'Tất cả' },
                                { val: 'pending', label: 'Chờ' },
                                { val: 'scheduled', label: 'Đã lên lịch' },
                                { val: 'done', label: 'Xong' },
                            ].map(f => (
                                <button key={f.val} onClick={() => setFilterStatus(f.val)}
                                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${filterStatus === f.val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Content ────────────────────────────────────────────── */}
                <div className="px-10 pt-14 pb-16 space-y-14 max-w-6xl">
                    {organized.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-5">
                            <Folder size={80} weight="thin" />
                            <div className="text-center">
                                <p className="text-[16px] font-bold text-slate-400">Chưa có dữ liệu</p>
                                <p className="text-[14px] text-slate-300 mt-1 mb-6">Nhấn vào nút bên dưới để tạo danh mục đầu tiên.</p>
                                <button onClick={() => setCatModal(true)}
                                    className="px-6 py-3 bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-100 transition-all active:scale-95">
                                    + Thêm danh mục
                                </button>
                            </div>
                        </div>
                    ) : organized.map(cat => (
                        <section key={cat.id}>
                            {/* Category header */}
                            <div className="flex items-center gap-4 mb-6 relative group">
                                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: cat.palette.hex }} />
                                <h2 className="text-[22px] font-black tracking-tight" style={{ color: cat.palette.hex }}>
                                    {cat.name}
                                </h2>
                                <span className="text-[12px] font-black px-2.5 py-1 rounded-full text-white"
                                    style={{ backgroundColor: cat.palette.hex }}>
                                    {cat.tasks.length} task
                                </span>

                                <button onClick={() => setInlineCategory(cat.id)}
                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 flex items-center gap-1.5 rounded-lg text-[13px] font-bold"
                                    style={{ color: cat.palette.dark, backgroundColor: cat.palette.light }}>
                                    <Plus weight="bold" size={12} /> Thêm công việc
                                </button>
                            </div>

                            {cat.tasks.length === 0 ? (
                                <div className="pl-5 pt-2">
                                    <p className="text-[14px] text-slate-400 italic mb-3">Danh mục này trống vì chưa có công việc nào.</p>
                                    <button onClick={() => setInlineCategory(cat.id)}
                                        className="text-[13px] font-bold px-4 py-2 rounded-xl transition-all"
                                        style={{ color: cat.palette.dark, backgroundColor: cat.palette.light }}>
                                        + Thêm công việc ngay
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead>
                                            <tr style={{ borderBottom: `2px solid ${cat.palette.light}` }}
                                                className="bg-slate-50/80">
                                                <th className="w-12 px-5 py-3" />
                                                <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên task</th>
                                                <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 whitespace-nowrap">Hạn chót</th>
                                                <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32 whitespace-nowrap">Mức ưu tiên</th>
                                                <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32 whitespace-nowrap">Trạng thái</th>
                                                <th className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32 text-right whitespace-nowrap">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {cat.tasks.map(task => {
                                                const pm = PRIORITY_META[task.priority ?? 2] ?? PRIORITY_META[2];
                                                const sm = STATUS_META[task.status] ?? STATUS_META.pending;
                                                return (
                                                    <tr key={task.id} className="group hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <div className={`w-4 h-4 border-2 rounded-md cursor-pointer transition-all flex items-center justify-center ${task.status === 'done' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                                                {task.status === 'done' && <Check size={10} weight="bold" className="text-white" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span className={`text-[14px] font-semibold leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                                {task.title}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span className="text-[13px] font-medium text-slate-600">
                                                                {task.dueTime ? format(new Date(task.dueTime), 'dd MMM, HH:mm', { locale: vi }) : '–'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${pm.bg} ${pm.color}`}>{pm.label}</span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${sm.bg} ${sm.color}`}>{sm.label}</span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => {
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
                                                                    className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-colors">
                                                                    <PencilSimple size={14} weight="bold" />
                                                                </button>
                                                                {task.status !== 'done' && !(task.dueTime && new Date(task.dueTime) < new Date()) && (
                                                                <button onClick={(e) => { e.preventDefault(); setDeleteTaskId(task.id); setTaskErr(''); }}
                                                                    className="p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors">
                                                                    <Trash size={14} weight="bold" />
                                                                </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}


                                            {/* Add trigger */}
                                            <tr className="bg-slate-50/30">
                                                <td colSpan={6} className="px-5 py-2.5">
                                                    <button onClick={() => setInlineCategory(cat.id)}
                                                        className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-indigo-600 transition-colors group/a">
                                                        <Plus size={13} weight="bold" className="group-hover/a:scale-110 transition-transform" />
                                                        Thêm công việc mới
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            </main>

            {/* ══ Modal: Danh mục ════════════════════════════════════════════ */}
            {catModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setCatModal(false); setCatErr(''); setCatName(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-[22px] font-black text-slate-900">Danh mục mới</h2>
                                <p className="text-[13px] text-slate-400 mt-0.5">Tạo nhóm học tập của bạn</p>
                            </div>
                            <button onClick={() => { setCatModal(false); setCatErr(''); setCatName(''); }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCat} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên danh mục</label>
                                <input autoFocus type="text" value={catName}
                                    onChange={e => { setCatName(e.target.value); setCatErr(''); }}
                                    placeholder="VD: Kinh tế, Lịch sử, Toán học..."
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[16px] font-bold text-slate-800 transition-all"
                                />
                                {catErr && <p className="text-[12px] text-red-500 font-semibold mt-2">{catErr}</p>}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setCatModal(false); setCatName(''); }}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                <button type="submit" disabled={!catName.trim() || createCategory.isPending}
                                    className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {createCategory.isPending ? 'Đang tạo...' : '✦ Tạo danh mục'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Edit Category ════════════════════════════════════════════ */}
            {editCatId !== null && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setEditCatId(null); setCatErr(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-[22px] font-black text-slate-900">Sửa danh mục</h2>
                            </div>
                            <button onClick={() => { setEditCatId(null); setCatErr(''); }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleEditCat} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên danh mục</label>
                                <input autoFocus type="text" value={editCatName}
                                    onChange={e => { setEditCatName(e.target.value); setCatErr(''); }}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[16px] font-bold text-slate-800 transition-all"
                                />
                                {catErr && <p className="text-[12px] text-red-500 font-semibold mt-2">{catErr}</p>}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setEditCatId(null); }}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                <button type="submit" disabled={!editCatName.trim() || updateCategory.isPending}
                                    className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {updateCategory.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Delete Category ════════════════════════════════════════════ */}
            {deleteCatId !== null && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setDeleteCatId(null); setCatErr(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash size={32} weight="fill" />
                        </div>
                        <h2 className="text-[20px] font-black text-slate-900 mb-2">Xóa danh mục?</h2>
                        <p className="text-[14px] text-slate-500 mb-6">
                            Các môn học và công việc thuộc danh mục này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
                        </p>
                        {catErr && <p className="text-[12px] text-red-500 font-semibold mb-4">{catErr}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteCatId(null)}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                            <button onClick={handleDeleteCat} disabled={deleteCategory.isPending}
                                className="flex-[2] py-3.5 bg-red-500 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-red-200 hover:bg-red-600 disabled:opacity-50 transition-all active:scale-[0.98]">
                                {deleteCategory.isPending ? 'Đang xóa...' : 'Xóa ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Modal: Edit Task ════════════════════════════════════════════ */}
            {editTaskId !== null && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setEditTaskId(null); setTaskErr(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-[22px] font-black text-slate-900">Sửa công việc</h2>
                            </div>
                            <button onClick={() => { setEditTaskId(null); setTaskErr(''); }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleEditTask} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên công việc</label>
                                <input autoFocus type="text" value={editTaskTitle}
                                    onChange={e => { setEditTaskTitle(e.target.value); setTaskErr(''); }}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[16px] font-bold text-slate-800 transition-all"
                                />
                            </div>

                            {/* Segmented Control for Type Selector */}
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl my-5">
                                <button
                                    type="button"
                                    onClick={() => { setEditTaskType('TASK'); setTaskErr(''); }}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${editTaskType === 'TASK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <GraduationCap weight="bold" size={16} />
                                    Công việc thường
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setEditTaskType('SESSION'); setTaskErr(''); }}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${editTaskType === 'SESSION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Sparkle weight="bold" size={16} />
                                    Phiên học (Khóa lịch)
                                </button>
                            </div>

                            {editTaskType === 'TASK' ? (
                                <div>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Hạn chót</label>
                                    <input type="datetime-local" value={editTaskDueTime}
                                        onChange={e => setEditTaskDueTime(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Bắt đầu</label>
                                        <input type="datetime-local" value={editTaskStartTime}
                                            onChange={e => { setEditTaskStartTime(e.target.value); setTaskErr(''); }}
                                            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Kết thúc</label>
                                        <input type="datetime-local" value={editTaskEndTime}
                                            onChange={e => { setEditTaskEndTime(e.target.value); setTaskErr(''); }}
                                            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Mức độ ưu tiên</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map((p) => {
                                        const meta = PRIORITY_META[p];
                                        const isSelected = editTaskPriority === p;
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setEditTaskPriority(p)}
                                                className={`py-3 px-1 rounded-xl text-xs font-bold transition-all border ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                {meta.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái</label>
                                <select value={editTaskStatus} onChange={e => setEditTaskStatus(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all">
                                    <option value="pending">Chờ</option>
                                    <option value="scheduled">Đã lên lịch</option>
                                    <option value="done">Hoàn thành</option>
                                    <option value="skipped">Bỏ qua</option>
                                </select>
                            </div>

                            {taskErr && <p className="text-[12px] text-red-500 font-semibold mt-2">{taskErr}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setEditTaskId(null); }}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                <button type="submit" disabled={!editTaskTitle.trim() || updateTask.isPending}
                                    className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {updateTask.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Delete Task ════════════════════════════════════════════ */}
            {deleteTaskId !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[8px] z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setDeleteTaskId(null); setTaskErr(''); } }}>
                    <div className="bg-white border border-slate-200/60 rounded-[32px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.12)] w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
                        
                        {/* Glowing warning ring */}
                        <div className="w-20 h-20 bg-rose-50 border-4 border-rose-100/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <div className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-red-600 text-white rounded-full flex items-center justify-center shadow-md">
                                <Trash size={22} weight="bold" />
                            </div>
                        </div>

                        <h2 className="text-[22px] font-black text-slate-900 tracking-tight mb-2.5">Xóa công việc?</h2>
                        <p className="text-[13.5px] text-slate-500 font-medium leading-relaxed mb-8 px-2">
                            Công việc này sẽ bị xóa khỏi hệ thống. Hành động này <span className="text-rose-500 font-black">không thể</span> hoàn tác.
                        </p>
                        
                        {taskErr && (
                            <div className="bg-red-50 text-red-600 text-[12px] font-bold py-3 px-4 rounded-xl border border-red-100 mb-6 animate-in shake duration-300">
                                {taskErr}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={() => setDeleteTaskId(null)}
                                className="flex-1 py-4 rounded-[20px] font-black text-[13px] uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all border border-slate-200/40">
                                Hủy
                            </button>
                            <button onClick={handleDeleteTask} disabled={deleteTask.isPending}
                                className="flex-[2] py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-[20px] font-black text-[13px] uppercase tracking-wider shadow-lg shadow-rose-100 active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-rose-200/60 disabled:opacity-50 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {deleteTask.isPending ? 'Đang xóa...' : 'Xóa ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Floating AI Button ════════════════════════════════════════════ */}
            <button
                onClick={() => setAiModalOpen(true)}
                className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform active:scale-95 group"
            >
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform opacity-0 group-hover:opacity-100" />
                <Sparkle size={26} weight="fill" className="relative z-10" />
            </button>

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
