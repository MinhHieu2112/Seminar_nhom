import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkle, Image as ImageIcon, Warning, CircleNotch, Check, FileText, Plus, Trash } from '@phosphor-icons/react';
import { useGenerateAiScheduleFromPrompt, useGenerateAiScheduleFromImage, useCreateAiScheduleBatch, AiSchedulePreview } from '@/hooks/useAiGenerator';
import { useSchedulerCategories, useCreateCategory } from '@/hooks/useScheduler';

interface EditableTask {
    title: string;
    priority: number;
    type: 'TASK' | 'SESSION';
    deadline: string;
    startTime: string;
    endTime: string;
    categoryId: string;
    confidence?: number;
}

interface AiScheduleModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AiScheduleModal({ onClose, onSuccess }: AiScheduleModalProps) {
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<AiSchedulePreview | null>(null);
    const [editedTasks, setEditedTasks] = useState<EditableTask[]>([]);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateFromPromptMutation = useGenerateAiScheduleFromPrompt();
    const generateFromImageMutation = useGenerateAiScheduleFromImage();
    const createBatchMutation = useCreateAiScheduleBatch();

    const { data: categories = [] } = useSchedulerCategories();
    const createCategoryMutation = useCreateCategory();

    const isGenerating = generateFromPromptMutation.isPending || generateFromImageMutation.isPending;
    const isSaving = createBatchMutation.isPending;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setErrorInfo(null);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setErrorInfo(null);
        }
    };

    const handleGenerate = async () => {
        setErrorInfo(null);
        setPreview(null);
        try {
            let res: AiSchedulePreview;
            if (mode === 'image') {
                if (!file) {
                    setErrorInfo("Vui lòng tải ảnh lên để bắt đầu.");
                    return;
                }
                res = await generateFromImageMutation.mutateAsync({ file, prompt });
            } else {
                const promptToSend = prompt.trim() || "Tuần sau tôi thi Toán và Lý, lên lịch học 2 tiếng mỗi ngày vào buổi tối";
                res = await generateFromPromptMutation.mutateAsync(promptToSend);
            }

            if (!res || !res.tasks || res.tasks.length === 0) {
                setErrorInfo("Không thể trích xuất công việc từ nội dung này.");
                return;
            }

            const formatToLocalDatetime = (isoString?: string) => {
                if (!isoString) return '';
                try {
                    const d = new Date(isoString);
                    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                } catch {
                    return '';
                }
            };

            const initialTasks: EditableTask[] = res.tasks.map(t => {
                const matchedCat = categories.find(
                    c => c.name.toLowerCase().trim() === (t.category || '').toLowerCase().trim()
                );
                return {
                    title: t.title || '',
                    priority: t.priority || 2,
                    type: t.type || 'TASK',
                    deadline: t.type === 'TASK' && t.deadline ? formatToLocalDatetime(t.deadline) : '',
                    startTime: t.type === 'SESSION' && t.sessionData?.startTime ? formatToLocalDatetime(t.sessionData.startTime) : '',
                    endTime: t.type === 'SESSION' && t.sessionData?.endTime ? formatToLocalDatetime(t.sessionData.endTime) : '',
                    categoryId: matchedCat ? matchedCat.id : (categories[0]?.id || ''),
                    confidence: t.confidence,
                };
            });

            setPreview(res);
            setEditedTasks(initialTasks);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setErrorInfo(error.response?.data?.message || error.message || "Không thể tạo lịch trình. Vui lòng thử lại.");
        }
    };

    const updateTaskField = <K extends keyof EditableTask>(index: number, field: K, value: EditableTask[K]) => {
        setEditedTasks(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
    };

    const deleteTaskRow = (index: number) => {
        setEditedTasks(prev => prev.filter((_, i) => i !== index));
    };

    const addTaskRow = () => {
        setEditedTasks(prev => [...prev, {
            title: '',
            priority: 2,
            type: 'TASK',
            deadline: '',
            startTime: '',
            endTime: '',
            categoryId: categories[0]?.id || '',
            confidence: 1.0,
        }]);
    };

    const handleSave = async () => {
        if (!preview) return;
        if (editedTasks.length === 0) {
            setErrorInfo("Vui lòng thêm ít nhất một công việc.");
            return;
        }

        // Validate
        for (let i = 0; i < editedTasks.length; i++) {
            const t = editedTasks[i];
            if (!t.title.trim()) {
                setErrorInfo(`Vui lòng điền tên cho công việc thứ ${i + 1}.`);
                return;
            }
            if (t.type === 'SESSION') {
                if (!t.startTime || !t.endTime) {
                    setErrorInfo(`Vui lòng điền đầy đủ thời gian bắt đầu và kết thúc cho công việc thứ ${i + 1}.`);
                    return;
                }
                if (new Date(t.startTime) >= new Date(t.endTime)) {
                    setErrorInfo(`Thời gian kết thúc phải sau thời gian bắt đầu ở công việc thứ ${i + 1}.`);
                    return;
                }
            }
        }

        try {
            let fallbackCatId = '';
            if (categories.length > 0) {
                fallbackCatId = categories[0].id;
            } else {
                const newCatResponse = await createCategoryMutation.mutateAsync({ name: 'Học tập' });
                fallbackCatId = newCatResponse.data.id;
            }

            const tasksToSave = editedTasks.map(t => {
                const sessionData = t.type === 'SESSION' ? {
                    startTime: new Date(t.startTime).toISOString(),
                    endTime: new Date(t.endTime).toISOString(),
                } : undefined;

                return {
                    title: t.title.trim(),
                    duration: 60,
                    priority: t.priority,
                    type: t.type,
                    deadline: t.type === 'TASK' && t.deadline ? new Date(t.deadline).toISOString() : undefined,
                    sessionData,
                    categoryId: t.categoryId || fallbackCatId,
                };
            });

            await createBatchMutation.mutateAsync({
                preview: {
                    ...preview,
                    tasks: tasksToSave,
                },
                categoryId: fallbackCatId,
            });
            onSuccess();
            onClose();
        } catch {
            setErrorInfo("Lưu lịch trình thất bại.");
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[300] flex items-center justify-center p-4"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 230 }}
                    className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[85vh] border border-slate-250/60 dark:border-slate-800/80"
                >
                    {/* Modal Header */}
                    <div className="px-8 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-900/40">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C63FF] via-[#A855F7] to-[#EC4899] flex items-center justify-center text-white shadow-md shadow-indigo-500/10 shrink-0">
                                <Sparkle size={20} weight="fill" className="animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold text-slate-850 dark:text-white tracking-tight leading-none">Trợ lý AI Scheduler</h2>
                                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1.5 block">
                                    {mode === 'text' ? 'Tạo lịch trình qua văn bản' : 'Trích xuất lịch trình từ hình ảnh'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
                        >
                            <X size={16} weight="bold" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-8 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20">
                        {!preview ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                {/* Mode Selector with Sliding Indicator */}
                                <div className="relative flex bg-slate-100/60 dark:bg-slate-800/65 p-1 rounded-2xl border border-slate-200/10 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('text'); setErrorInfo(null); }}
                                        className={`relative flex-1 py-3.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2 ${mode === 'text' ? 'text-[#6C63FF] dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-350'}`}
                                    >
                                        {mode === 'text' && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200/10"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            <FileText weight="bold" size={16} />
                                            Nhập văn bản
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('image'); setErrorInfo(null); }}
                                        className={`relative flex-1 py-3.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2 ${mode === 'image' ? 'text-[#6C63FF] dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-350'}`}
                                    >
                                        {mode === 'image' && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200/10"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            <ImageIcon weight="bold" size={16} />
                                            Quét từ ảnh
                                        </span>
                                    </button>
                                </div>

                                {/* Form Sections Grouped in Subtle Cards */}
                                <div className="space-y-4">
                                    {/* Text Prompt Mode */}
                                    {mode === 'text' ? (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-[#6C63FF] rounded-full" />
                                                <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 tracking-wider uppercase">Lời nhắc (Prompt)</label>
                                            </div>
                                            <textarea
                                                value={prompt}
                                                onChange={e => setPrompt(e.target.value)}
                                                placeholder="VD: Tuần sau tôi thi Toán và Lý, lên lịch học 2 tiếng mỗi ngày vào buổi tối..."
                                                rows={4}
                                                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/15 rounded-xl outline-none text-xs font-semibold text-slate-750 dark:text-slate-300 transition-all resize-none shadow-sm placeholder:text-slate-450"
                                            />
                                        </motion.div>
                                    ) : (
                                        /* Image Scanning Mode */
                                        <motion.div 
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            {/* Drag & Drop File Area */}
                                            <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-3 bg-[#A855F7] rounded-full" />
                                                    <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 tracking-wider uppercase">Tải ảnh lên</label>
                                                </div>

                                                <div
                                                    onDragEnter={handleDrag}
                                                    onDragOver={handleDrag}
                                                    onDragLeave={handleDrag}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center ${
                                                        dragActive 
                                                            ? 'border-[#6C63FF] bg-[#6C63FF]/5 dark:bg-[#6C63FF]/5 shadow-[0_0_15px_rgba(108,99,255,0.1)] scale-[1.005]' 
                                                            : file 
                                                                ? 'border-emerald-400 bg-emerald-50/5 dark:bg-emerald-950/5' 
                                                                : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:border-[#6C63FF]/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                                                        file 
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' 
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-[#6C63FF] group-hover:bg-[#6C63FF]/5 dark:text-slate-400'
                                                    }`}>
                                                        {file ? <Check size={24} weight="bold" /> : <ImageIcon size={24} />}
                                                    </div>
                                                    {file ? (
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Đã nhận hình ảnh thành công</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-355">Kéo thả ảnh hoặc click để tải lên</p>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Hỗ trợ PNG, JPG, JPEG thời khóa biểu hoặc ghi chú</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Optional Guidelines */}
                                            {file && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-[#6C63FF] rounded-full" />
                                                        <label className="block text-[11px] font-bold text-slate-450 dark:text-slate-400 tracking-wider uppercase">Chỉ dẫn bổ sung (Tùy chọn)</label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={prompt}
                                                        onChange={e => setPrompt(e.target.value)}
                                                        placeholder="VD: Chỉ lấy lịch học của tuần tới..."
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:border-[#6C63FF] rounded-xl outline-none text-xs font-semibold text-slate-750 dark:text-slate-300 transition-all shadow-sm placeholder:text-slate-400"
                                                    />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Error Notification */}
                                {errorInfo && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                                        <Warning size={18} weight="fill" className="shrink-0" />
                                        <div className="text-[11px] font-semibold leading-relaxed">{errorInfo}</div>
                                    </div>
                                )}

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full py-3.5 mt-4 bg-gradient-to-r from-[#6C63FF] via-[#A855F7] to-[#EC4899] hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/15 transition-all active:scale-[0.985] flex items-center justify-center gap-2 relative overflow-hidden group cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {isGenerating ? (
                                        <>
                                            <CircleNotch size={16} weight="bold" className="animate-spin text-white" />
                                            <span>Đang phân tích dữ liệu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkle size={16} weight="fill" className="text-white animate-pulse" />
                                            <span>Tạo lịch trình ngay</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            /* Preview & Edit Mode */
                            <motion.div 
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-850 dark:text-white tracking-tight">Thiết lập lịch trình AI</h3>
                                        <p className="text-[11px] text-slate-450 dark:text-slate-550 font-medium">Biên tập các công việc & phiên học trước khi lưu</p>
                                    </div>
                                    <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                        <Check size={18} weight="bold" />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 rounded-2xl space-y-5 shadow-sm">
                                    {/* Topic Title */}
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Tên chủ đề / kế hoạch</label>
                                        <input
                                            type="text"
                                            value={preview.goalTitle}
                                            onChange={(e) => setPreview(prev => prev ? { ...prev, goalTitle: e.target.value } : null)}
                                            placeholder="Tên môn học / chủ đề..."
                                            className="w-full text-base font-bold text-[#6C63FF] text-center bg-indigo-50/30 dark:bg-indigo-950/10 focus:bg-white dark:focus:bg-slate-800/40 py-2.5 px-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 focus:border-[#6C63FF] outline-none transition-all focus:ring-2 focus:ring-[#6C63FF]/15"
                                        />
                                    </div>



                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Danh sách công việc dự kiến</span>
                                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-[#6C63FF] dark:text-indigo-350 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-100/30">{editedTasks.length} công việc</span>
                                    </div>

                                    {/* Task Entries list */}
                                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar pb-2">
                                        <AnimatePresence initial={false}>
                                            {editedTasks.map((t, i) => (
                                                <motion.div 
                                                    key={i} 
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="bg-slate-50/30 dark:bg-slate-800/20 p-4.5 rounded-xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-3.5 hover:border-[#6C63FF]/30 transition-all text-left"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="w-5.5 h-5.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#6C63FF] flex items-center justify-center text-[10px] font-bold border border-indigo-100/30 shrink-0">
                                                                #{i + 1}
                                                            </span>
                                                            <div className="flex bg-slate-200/40 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-350/20">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateTaskField(i, 'type', 'TASK')}
                                                                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold transition-all uppercase tracking-wider ${t.type === 'TASK' ? 'bg-white dark:bg-slate-700 text-[#6C63FF] dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                                >
                                                                    Nhiệm vụ
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateTaskField(i, 'type', 'SESSION')}
                                                                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold transition-all uppercase tracking-wider ${t.type === 'SESSION' ? 'bg-white dark:bg-slate-700 text-[#6C63FF] dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                                >
                                                                    Phiên học
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteTaskRow(i)}
                                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/25 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                                            title="Xóa công việc này"
                                                        >
                                                            <Trash size={14} weight="bold" />
                                                        </button>
                                                    </div>

                                                    {t.confidence !== undefined && t.confidence < 0.75 && (
                                                        <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200/40 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 p-2.5 rounded-lg flex items-center gap-2 text-[10px] font-semibold leading-snug animate-pulse">
                                                            <Warning size={14} weight="fill" className="shrink-0 text-[#D97706]" />
                                                            <span>AI phân loại không chắc chắn ({Math.round(t.confidence * 100)}%). Hãy kiểm tra lại danh mục!</span>
                                                        </div>
                                                    )}

                                                    <div className="space-y-1">
                                                        <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                            {t.type === 'SESSION' ? 'Tên phiên học' : 'Tên nhiệm vụ'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={t.title}
                                                            onChange={e => updateTaskField(i, 'title', e.target.value)}
                                                            placeholder="VD: Ôn tập chương 1..."
                                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:border-[#6C63FF] rounded-lg outline-none text-xs font-semibold text-slate-750 dark:text-slate-300 transition-all shadow-sm"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Độ ưu tiên</label>
                                                            <select
                                                                value={t.priority}
                                                                onChange={e => updateTaskField(i, 'priority', parseInt(e.target.value))}
                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:border-[#6C63FF] rounded-lg outline-none text-xs font-semibold text-slate-700 dark:text-slate-350 transition-all cursor-pointer shadow-sm"
                                                            >
                                                                <option value={1}>Thấp</option>
                                                                <option value={2}>Bình thường</option>
                                                                <option value={3}>Cao</option>
                                                                <option value={4}>Rất cao</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Danh mục</label>
                                                            <select
                                                                value={t.categoryId}
                                                                onChange={e => updateTaskField(i, 'categoryId', e.target.value)}
                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:border-[#6C63FF] rounded-lg outline-none text-xs font-semibold text-slate-700 dark:text-slate-350 transition-all cursor-pointer shadow-sm"
                                                            >
                                                                {categories.map((cat) => (
                                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {t.type === 'TASK' ? (
                                                            <div className="space-y-1">
                                                                <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hạn chót (Due Date)</label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={t.deadline}
                                                                    onChange={e => updateTaskField(i, 'deadline', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:border-[#6C63FF] rounded-lg outline-none text-xs font-medium text-slate-700 dark:text-slate-350 transition-all shadow-sm"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Bắt đầu</label>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={t.startTime}
                                                                        onChange={e => updateTaskField(i, 'startTime', e.target.value)}
                                                                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:border-[#6C63FF] rounded-lg outline-none text-[10px] font-medium text-slate-700 dark:text-slate-350 transition-all shadow-sm"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Kết thúc</label>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={t.endTime}
                                                                        onChange={e => updateTaskField(i, 'endTime', e.target.value)}
                                                                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 focus:border-[#6C63FF] rounded-lg outline-none text-[10px] font-medium text-slate-700 dark:text-slate-350 transition-all shadow-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {editedTasks.length === 0 && (
                                            <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-slate-100 dark:border-slate-850 p-6 space-y-2">
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 mx-auto">
                                                    <Warning size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Không có công việc nào</h4>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Danh sách công việc đang trống. Hãy nhấn nút bên dưới để thêm mới.</p>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={addTaskRow}
                                            className="w-full py-3 border-2 border-dashed border-slate-200/80 dark:border-slate-800 hover:border-[#6C63FF] bg-slate-50/10 hover:bg-[#6C63FF]/5 text-[#6C63FF] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                        >
                                            <Plus size={14} weight="bold" className="group-hover:scale-110 transition-transform" />
                                            Thêm công việc mới
                                        </button>
                                    </div>
                                </div>

                                {/* Preview Error Notification */}
                                {errorInfo && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                                        <Warning size={18} weight="fill" className="shrink-0" />
                                        <div className="text-[11px] font-semibold leading-relaxed">{errorInfo}</div>
                                    </div>
                                )}

                                {/* Bottom Navigation Action Buttons */}
                                <div className="flex gap-4 mt-6">
                                    <button 
                                        onClick={() => setPreview(null)} 
                                        className="flex-1 py-3 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-all active:scale-[0.98] border border-slate-200/20 dark:border-slate-700/50 cursor-pointer"
                                    >
                                        Hủy & Sửa đổi
                                    </button>
                                    <button 
                                        onClick={handleSave} 
                                        disabled={isSaving} 
                                        className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/15 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden cursor-pointer"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {isSaving ? <CircleNotch size={16} className="animate-spin" /> : <Check size={16} weight="bold" />}
                                        {isSaving ? "Đang lưu hệ thống..." : "Xác nhận & Lưu lịch"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
