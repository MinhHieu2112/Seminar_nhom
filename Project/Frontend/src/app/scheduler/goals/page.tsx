'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Plus, Folder, X, GraduationCap, Check,
    MagnifyingGlass, Sparkle,
    PencilSimple, Trash
} from '@phosphor-icons/react';
import {
    useSchedulerCategories, useSchedulerTasks,
    useSchedulerSubjects, useCreateCategory, useCreateTask, useCreateSubject,
    useUpdateCategory, useDeleteCategory, useUpdateSubject, useDeleteSubject,
    useUpdateTask, useDeleteTask
} from '@/hooks/useScheduler';
import { AiScheduleModal } from './AiScheduleModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Task, Category, Subject } from '@/types/api';

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

function InlineAddTask({ subjectId, onSave, onCancel }: {
    subjectId: string;
    onSave: (d: { title: string; subjectId: string; dueTime?: string; priority?: number }) => Promise<void>;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState(2);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const save = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try { await onSave({ title: title.trim(), subjectId, dueTime: dueTime ? new Date(dueTime).toISOString() : undefined, priority }); }
        finally { setSaving(false); }
    };

    return (
        <tr className="bg-indigo-50/60 border-b border-indigo-100/60">
            <td className="w-12 px-5 py-3"><div className="w-4.5 h-4.5 border-2 border-indigo-300 rounded-md" /></td>
            <td className="px-4 py-3">
                <input ref={ref} value={title} onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
                    placeholder="Nhập tên công việc..."
                    className="w-full bg-transparent outline-none text-[14px] font-semibold text-slate-800 placeholder:text-slate-400"
                />
            </td>
            <td className="px-4 py-3">
                <input type="datetime-local" value={dueTime} onChange={e => setDueTime(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] text-slate-600 outline-none"
                />
            </td>
            <td className="px-4 py-3">
                <select value={priority} onChange={e => setPriority(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[12px] font-semibold text-slate-600 outline-none"
                >
                    {[1, 2, 3, 4].map(p => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                </select>
            </td>
            <td className="px-4 py-3" colSpan={2}>
                <div className="flex items-center gap-1.5">
                    <button onClick={save} disabled={!title.trim() || saving}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all flex items-center gap-1">
                        <Check size={11} weight="bold" /> Lưu
                    </button>
                    <button onClick={onCancel} className="px-2.5 py-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all text-[12px] font-bold">Hủy</button>
                </div>
            </td>
        </tr>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GoalsPage() {
    const { data: categories = [], isLoading: lCat } = useSchedulerCategories();
    const { data: subjects = [], isLoading: lSub } = useSchedulerSubjects();
    const { data: tasks = [], isLoading: lTask } = useSchedulerTasks();

    const createCategory = useCreateCategory();
    const createSubject = useCreateSubject();
    const createTask = useCreateTask();

    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();
    const updateSubject = useUpdateSubject();
    const deleteSubject = useDeleteSubject();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();

    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [inlineSubject, setInlineSubject] = useState<string | null>(null);

    // Category modal
    const [catModal, setCatModal] = useState(false);
    const [catName, setCatName] = useState('');
    const [catErr, setCatErr] = useState('');

    const [editCatId, setEditCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

    // Subject modal
    const [subModal, setSubModal] = useState(false);
    const [subName, setSubName] = useState('');
    const [subCatId, setSubCatId] = useState('');
    const [subErr, setSubErr] = useState('');

    const [editSubId, setEditSubId] = useState<string | null>(null);
    const [editSubName, setEditSubName] = useState('');
    const [editSubCatId, setEditSubCatId] = useState('');
    const [deleteSubId, setDeleteSubId] = useState<string | null>(null);

    // Task modal
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState('');
    const [editTaskDueTime, setEditTaskDueTime] = useState('');
    const [editTaskPriority, setEditTaskPriority] = useState(2);
    const [editTaskStatus, setEditTaskStatus] = useState('pending');
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

    const handleCreateSub = async (e: React.FormEvent) => {
        e.preventDefault(); if (!subName.trim() || !subCatId) return;
        setSubErr('');
        try { await createSubject.mutateAsync({ name: subName.trim(), categoryId: subCatId }); setSubName(''); setSubCatId(''); setSubModal(false); }
        catch { setSubErr('Tạo môn học thất bại. Thử lại.'); }
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

    const handleEditSub = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editSubName.trim() || !editSubCatId || !editSubId) return;
        setSubErr('');
        try { await updateSubject.mutateAsync({ id: editSubId, data: { name: editSubName.trim(), categoryId: editSubCatId } }); setEditSubId(null); }
        catch { setSubErr('Cập nhật môn học thất bại. Thử lại.'); }
    };

    const handleDeleteSub = async () => {
        if (!deleteSubId) return;
        setSubErr('');
        try { await deleteSubject.mutateAsync(deleteSubId); setDeleteSubId(null); }
        catch { setSubErr('Xóa môn học thất bại. Thử lại.'); }
    };

    const handleEditTask = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editTaskTitle.trim() || !editTaskId) return;
        setTaskErr('');
        try {
            await updateTask.mutateAsync({
                id: editTaskId,
                data: {
                    title: editTaskTitle.trim(),
                    dueTime: editTaskDueTime ? new Date(editTaskDueTime).toISOString() : null,
                    priority: editTaskPriority,
                    status: editTaskStatus
                }
            });
            setEditTaskId(null);
        }
        catch { setTaskErr('Cập nhật công việc thất bại. Thử lại.'); }
    };

    const handleDeleteTask = async () => {
        if (!deleteTaskId) return;
        setTaskErr('');
        try { await deleteTask.mutateAsync(deleteTaskId); setDeleteTaskId(null); }
        catch { setTaskErr('Xóa công việc thất bại. Thử lại.'); }
    };



    const handleInlineSave = async (d: { title: string; subjectId: string; dueTime?: string; priority?: number }) => {
        await createTask.mutateAsync(d);
        setInlineSubject(null);
    };

    // ── Derived data ──────────────────────────────────────────────────────────

    const organized = useMemo(() => {
        const q = search.toLowerCase();
        return (categories as Category[]).map((cat, idx) => ({
            ...cat, palette: PALETTE[idx % PALETTE.length],
            subjects: (subjects as Subject[])
                .filter(s => s.categoryId === cat.id)
                .map(s => ({
                    ...s,
                    tasks: (tasks as Task[]).filter(t => {
                        if (t.subjectId !== s.id) return false;
                        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
                        if (q && !t.title.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false;
                        return true;
                    }),
                })),
        })).filter(cat => !filterCat || cat.id === filterCat);
    }, [categories, subjects, tasks, filterCat, filterStatus, search]);

    const totalTasks = (tasks as Task[]).length;
    const doneTasks = (tasks as Task[]).filter(t => t.status === 'done').length;

    if (lCat || lSub || lTask) return (
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
                            const count = (tasks as Task[]).filter(t =>
                                (subjects as Subject[]).find(s => s.id === t.subjectId && s.categoryId === cat.id)
                            ).length;
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
                                    {cat.subjects.reduce((a, s) => a + s.tasks.length, 0)} task
                                </span>

                                <button onClick={() => { setSubCatId(cat.id); setSubModal(true); }}
                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 flex items-center gap-1.5 rounded-lg text-[13px] font-bold"
                                    style={{ color: cat.palette.dark, backgroundColor: cat.palette.light }}>
                                    <Plus weight="bold" size={12} /> Thêm môn học
                                </button>
                            </div>

                            {cat.subjects.length === 0 ? (
                                <div className="pl-5 pt-2">
                                    <p className="text-[14px] text-slate-400 italic mb-3">Danh mục này trống vì chưa có môn học nào.</p>
                                    <button onClick={() => { setSubCatId(cat.id); setSubModal(true); }}
                                        className="text-[13px] font-bold px-4 py-2 rounded-xl transition-all"
                                        style={{ color: cat.palette.dark, backgroundColor: cat.palette.light }}>
                                        + Thêm môn học ngay
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {cat.subjects.map(sub => (
                                        <div key={sub.id}>
                                            {/* Subject label */}
                                            <div className="flex items-center mb-3 pl-1">
                                                <div className="group flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                                                        <GraduationCap weight="bold" size={14} className="text-slate-500" />
                                                        <span className="text-[13px] font-black text-slate-700 uppercase tracking-wider">{sub.name}</span>
                                                        <span className="text-[11px] font-bold text-slate-400">({sub.tasks.length})</span>
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-0 flex-none group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.preventDefault(); setEditSubId(sub.id); setEditSubName(sub.name); setEditSubCatId(sub.categoryId); setSubErr(''); }}
                                                            className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-colors">
                                                            <PencilSimple size={14} weight="bold" />
                                                        </button>
                                                        <button onClick={(e) => { e.preventDefault(); setDeleteSubId(sub.id); setSubErr(''); }}
                                                            className="p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash size={14} weight="bold" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Task table */}
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
                                                        {sub.tasks.map(task => {
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
                                                                                // Convert UTC to local datetime-local format format string YYYY-MM-DDTHH:mm
                                                                                if (task.dueTime) {
                                                                                    const d = new Date(task.dueTime);
                                                                                    const ds = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                                                    setEditTaskDueTime(ds);
                                                                                } else {
                                                                                    setEditTaskDueTime('');
                                                                                }
                                                                                setEditTaskPriority(task.priority ?? 2);
                                                                                setEditTaskStatus(task.status);
                                                                                setTaskErr('');
                                                                            }}
                                                                                className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-colors">
                                                                                <PencilSimple size={14} weight="bold" />
                                                                            </button>
                                                                            <button onClick={(e) => { e.preventDefault(); setDeleteTaskId(task.id); setTaskErr(''); }}
                                                                                className="p-1 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors">
                                                                                <Trash size={14} weight="bold" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}

                                                        {/* Inline add */}
                                                        {inlineSubject === sub.id && (
                                                            <InlineAddTask
                                                                subjectId={sub.id}
                                                                onSave={handleInlineSave} onCancel={() => setInlineSubject(null)}
                                                            />
                                                        )}

                                                        {/* Add trigger */}
                                                        <tr className="bg-slate-50/30">
                                                            <td colSpan={6} className="px-5 py-2.5">
                                                                <button onClick={() => setInlineSubject(sub.id)}
                                                                    className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-indigo-600 transition-colors group/a">
                                                                    <Plus size={13} weight="bold" className="group-hover/a:scale-110 transition-transform" />
                                                                    Thêm công việc mới
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
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

            {/* ══ Modal: Môn học ═════════════════════════════════════════════ */}
            {subModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setSubModal(false); setSubErr(''); setSubName(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-[22px] font-black text-slate-900">Môn học mới</h2>
                                <p className="text-[13px] text-slate-400 mt-0.5">Thêm môn học vào danh mục</p>
                            </div>
                            <button onClick={() => { setSubModal(false); setSubErr(''); setSubName(''); }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSub} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên môn học</label>
                                <input autoFocus type="text" value={subName}
                                    onChange={e => { setSubName(e.target.value); setSubErr(''); }}
                                    placeholder="VD: Toán cao cấp, Anh văn..."
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[16px] font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Danh mục</label>
                                <select value={subCatId} onChange={e => setSubCatId(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all">
                                    <option value="">-- Chọn danh mục --</option>
                                    {(categories as Category[]).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {subErr && <p className="text-[12px] text-red-500 font-semibold mt-2">{subErr}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setSubModal(false); setSubName(''); }}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                <button type="submit" disabled={!subName.trim() || !subCatId || createSubject.isPending}
                                    className="flex-[2] py-3.5 bg-sky-500 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-sky-200 hover:bg-sky-600 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {createSubject.isPending ? 'Đang tạo...' : '✦ Tạo môn học'}
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

            {/* ══ Modal: Edit Subject ════════════════════════════════════════════ */}
            {editSubId !== null && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setEditSubId(null); setSubErr(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-[22px] font-black text-slate-900">Sửa môn học</h2>
                            </div>
                            <button onClick={() => { setEditSubId(null); setSubErr(''); }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSub} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên môn học</label>
                                <input autoFocus type="text" value={editSubName}
                                    onChange={e => { setEditSubName(e.target.value); setSubErr(''); }}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[16px] font-bold text-slate-800 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Danh mục</label>
                                <select value={editSubCatId} onChange={e => setEditSubCatId(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all">
                                    {(categories as Category[]).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {subErr && <p className="text-[12px] text-red-500 font-semibold mt-2">{subErr}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setEditSubId(null); }}
                                    className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                                <button type="submit" disabled={!editSubName.trim() || !editSubCatId || updateSubject.isPending}
                                    className="flex-[2] py-3.5 bg-sky-500 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-sky-200 hover:bg-sky-600 disabled:opacity-50 transition-all active:scale-[0.98]">
                                    {updateSubject.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ Modal: Delete Subject ════════════════════════════════════════════ */}
            {deleteSubId !== null && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setDeleteSubId(null); setSubErr(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash size={32} weight="fill" />
                        </div>
                        <h2 className="text-[20px] font-black text-slate-900 mb-2">Xóa môn học?</h2>
                        <p className="text-[14px] text-slate-500 mb-6">
                            Các công việc thuộc môn học này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
                        </p>
                        {subErr && <p className="text-[12px] text-red-500 font-semibold mb-4">{subErr}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteSubId(null)}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                            <button onClick={handleDeleteSub} disabled={deleteSubject.isPending}
                                className="flex-[2] py-3.5 bg-red-500 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-red-200 hover:bg-red-600 disabled:opacity-50 transition-all active:scale-[0.98]">
                                {deleteSubject.isPending ? 'Đang xóa...' : 'Xóa ngay'}
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
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Hạn chót</label>
                                <input type="datetime-local" value={editTaskDueTime}
                                    onChange={e => setEditTaskDueTime(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Ưu tiên</label>
                                    <select value={editTaskPriority} onChange={e => setEditTaskPriority(Number(e.target.value))}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all">
                                        {[1, 2, 3, 4].map(p => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái</label>
                                    <select value={editTaskStatus} onChange={e => setEditTaskStatus(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-semibold text-slate-700 transition-all">
                                        <option value="pending">Chờ</option>
                                        <option value="scheduled">Đã lên lịch</option>
                                        <option value="done">Hoàn thành</option>
                                        <option value="skipped">Bỏ qua</option>
                                    </select>
                                </div>
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
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setDeleteTaskId(null); setTaskErr(''); } }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash size={32} weight="fill" />
                        </div>
                        <h2 className="text-[20px] font-black text-slate-900 mb-2">Xóa công việc?</h2>
                        <p className="text-[14px] text-slate-500 mb-6">
                            Công việc này sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.
                        </p>
                        {taskErr && <p className="text-[12px] text-red-500 font-semibold mb-4">{taskErr}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTaskId(null)}
                                className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Hủy</button>
                            <button onClick={handleDeleteTask} disabled={deleteTask.isPending}
                                className="flex-[2] py-3.5 bg-red-500 text-white rounded-2xl font-black text-[14px] shadow-lg shadow-red-200 hover:bg-red-600 disabled:opacity-50 transition-all active:scale-[0.98]">
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
                    onSuccess={() => { setAiModalOpen(false); /* The React Query invalidation will naturally refresh the lists */ }}
                />
            )}

        </div>
    );
}
