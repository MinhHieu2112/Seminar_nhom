import React, { useState, useRef } from 'react';
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

    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateFromPromptMutation = useGenerateAiScheduleFromPrompt();
    const generateFromImageMutation = useGenerateAiScheduleFromImage();
    const createBatchMutation = useCreateAiScheduleBatch();

    const { data: categories = [] } = useSchedulerCategories();
    const createCategoryMutation = useCreateCategory();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    const isGenerating = generateFromPromptMutation.isPending || generateFromImageMutation.isPending;
    const isSaving = createBatchMutation.isPending;

    // Set first category as default once loaded

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
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

            const initialTasks: EditableTask[] = res.tasks.map(t => ({
                title: t.title || '',
                priority: t.priority || 2,
                type: t.type || 'TASK',
                deadline: t.type === 'TASK' && t.deadline ? formatToLocalDatetime(t.deadline) : '',
                startTime: t.type === 'SESSION' && t.sessionData?.startTime ? formatToLocalDatetime(t.sessionData.startTime) : '',
                endTime: t.type === 'SESSION' && t.sessionData?.endTime ? formatToLocalDatetime(t.sessionData.endTime) : '',
            }));

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
            let catId = selectedCategoryId;
            if (!catId) {
                if (categories.length > 0) {
                    catId = categories[0].id;
                } else {
                    const newCatResponse = await createCategoryMutation.mutateAsync({ name: 'Học tập' });
                    catId = newCatResponse.data.id;
                }
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
                };
            });

            await createBatchMutation.mutateAsync({
                preview: {
                    ...preview,
                    tasks: tasksToSave,
                },
                categoryId: catId,
            });
            onSuccess();
            onClose();
        } catch {
            setErrorInfo("Lưu lịch trình thất bại.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh] md:h-auto md:max-h-[85vh] border border-slate-200/50">

                <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/30">
                            <Sparkle size={24} weight="fill" className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-[20px] font-black text-slate-900 tracking-tight">Trợ lý AI Scheduler</h2>
                            <p className="text-[13px] text-slate-400 font-bold mt-0.5">Tạo lịch trình qua văn bản</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} weight="bold" />
                    </button>
                </div>

                <div className="p-10 flex-1 overflow-y-auto bg-slate-50/50">

                    {!preview ? (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex bg-slate-100/80 p-1.5 rounded-[22px] mb-8 border border-slate-200/20 shadow-inner">
                                <button
                                    onClick={() => { setMode('text'); setErrorInfo(null); }}
                                    className={`flex-1 py-3.5 rounded-[18px] text-[13px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${mode === 'text' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50 scale-[1.01]' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    <FileText weight="bold" size={16} />
                                    Nhập văn bản
                                </button>
                                <button
                                    onClick={() => { setMode('image'); setErrorInfo(null); }}
                                    className={`flex-1 py-3.5 rounded-[18px] text-[13px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${mode === 'image' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50 scale-[1.01]' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    <ImageIcon weight="bold" size={16} />
                                    Quét từ ảnh
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 mb-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-indigo-500/80 rounded-full" />
                                    <label className="block text-[13px] font-black text-slate-800 tracking-wide uppercase opacity-75">Lưu vào Danh mục</label>
                                </div>
                                {categories.length > 0 ? (
                                    <div className="relative">
                                        <select
                                            value={selectedCategoryId || categories[0]?.id || ''}
                                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200/50 focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-bold text-slate-800 transition-all cursor-pointer appearance-none"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                                            ▼
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[13px] text-slate-500 font-bold italic bg-slate-50 p-4 rounded-2xl border border-slate-200/50">Hệ thống sẽ tự động tạo danh mục &quot;Học tập&quot; cho bạn.</p>
                                )}
                            </div>

                            {mode === 'text' ? (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1.5 h-4 bg-indigo-500/80 rounded-full" />
                                            <label className="block text-[13px] font-black text-slate-800 tracking-wide uppercase opacity-75">Lời nhắc (Prompt)</label>
                                        </div>
                                        <textarea
                                            value={prompt}
                                            onChange={e => setPrompt(e.target.value)}
                                            placeholder="VD: Tuần sau tôi thi Toán và Lý, lên lịch học 2 tiếng mỗi ngày vào buổi tối..."
                                            rows={5}
                                            className="w-full p-5 bg-slate-50/50 border border-slate-200/50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50/40 rounded-[20px] outline-none text-[15px] font-medium text-slate-800 transition-all resize-none shadow-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1.5 h-4 bg-purple-500/80 rounded-full" />
                                            <label className="block text-[13px] font-black text-slate-800 tracking-wide uppercase opacity-75">Tải ảnh lên</label>
                                        </div>
                                        
                                        <div
                                            className={`border-3 border-dashed rounded-[24px] p-10 text-center transition-all group ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-slate-50'}`}
                                        >
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                            <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <div className="w-16 h-16 bg-slate-100 text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 transition-all border border-slate-200/10">
                                                    <ImageIcon size={32} />
                                                </div>
                                                {file ? (
                                                    <div className="space-y-1">
                                                        <p className="text-[14px] font-bold text-indigo-600 flex items-center gap-1.5 justify-center">
                                                            <Check size={16} weight="bold" /> Đã chọn file thành công
                                                        </p>
                                                        <p className="text-[12px] text-slate-400 font-semibold">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <p className="text-[14px] font-black text-slate-700">Kéo thả ảnh hoặc click để tải lên</p>
                                                        <p className="text-[12px] text-slate-400 font-semibold">Hỗ trợ PNG, JPG, JPEG thời khóa biểu hoặc ghi chú</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {file && (
                                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-1.5 h-4 bg-indigo-500/80 rounded-full" />
                                                <label className="block text-[13px] font-black text-slate-800 tracking-wide uppercase opacity-75">Bổ sung chỉ dẫn (Tùy chọn)</label>
                                            </div>
                                            <input
                                                type="text"
                                                value={prompt}
                                                onChange={e => setPrompt(e.target.value)}
                                                placeholder="VD: Chỉ lấy lịch học của tuần tới..."
                                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[15px] font-medium"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {errorInfo && (
                                <div className="mt-6 p-4.5 bg-red-50 border border-red-100 rounded-[20px] flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                                    <Warning size={20} weight="fill" className="shrink-0" />
                                    <div className="text-[13px] font-bold leading-relaxed">{errorInfo}</div>
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full py-4.5 mt-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-[20px] font-black text-[15px] shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/60 transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {isGenerating ? (
                                    <><CircleNotch size={18} weight="bold" className="animate-spin text-indigo-200" /> <span className="tracking-wide uppercase text-[13px] font-black">Đang phân tích dữ liệu...</span></>
                                ) : (
                                    <><Sparkle size={18} weight="fill" className="text-indigo-200 animate-pulse" /> <span className="tracking-wide uppercase text-[13px] font-black">Tạo lịch trình ngay</span></>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-8 duration-500">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Thiết lập lịch trình AI</h3>
                                    <p className="text-[14px] text-slate-500 font-medium">Biên tập các công việc & phiên học trước khi lưu</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Check size={24} weight="bold" />
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/60 rounded-[28px] p-8 mb-8 shadow-sm">
                                <input
                                    type="text"
                                    value={preview.goalTitle}
                                    onChange={(e) => setPreview(prev => prev ? { ...prev, goalTitle: e.target.value } : null)}
                                    placeholder="Tên môn học / chủ đề..."
                                    className="w-full text-[20px] font-black text-indigo-600 text-center bg-indigo-50/50 hover:bg-indigo-50/80 focus:bg-white py-4 px-6 rounded-[20px] border border-indigo-100/50 focus:border-indigo-400 outline-none shadow-sm transition-all mb-6 focus:ring-4 focus:ring-indigo-100/50"
                                />

                                {/* Category selector */}
                                <div className="bg-slate-50/60 p-6 rounded-[24px] border border-slate-200/50 mb-8 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-indigo-500/80 rounded-full" />
                                        <label className="block text-[13px] font-black text-slate-800 tracking-wide uppercase opacity-75">Lưu vào Danh mục</label>
                                    </div>
                                    {categories.length > 0 ? (
                                        <div className="relative">
                                            <select
                                                value={selectedCategoryId || categories[0]?.id || ''}
                                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                                className="w-full px-5 py-4 bg-white border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[14px] font-bold text-slate-800 transition-all shadow-sm cursor-pointer appearance-none animate-in fade-in"
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                                                ▼
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[13px] text-slate-500 font-bold italic bg-white p-4 rounded-2xl border border-slate-200/50">Hệ thống sẽ tự động tạo danh mục &quot;Học tập&quot; cho bạn.</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                    <div className="text-[13px] font-black text-slate-800 uppercase tracking-wider opacity-75">Danh sách công việc dự kiến</div>
                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-black border border-indigo-100">{editedTasks.length} công việc</span>
                                </div>

                                <div className="space-y-6 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                                    {editedTasks.map((t, i) => (
                                        <div key={i} className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-200/60 shadow-sm space-y-4 hover:border-indigo-300 hover:shadow-md transition-all relative group">
                                            <div className="flex items-center justify-between border-b border-slate-200/40 pb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[12px] font-black border border-indigo-100">
                                                        #{i + 1}
                                                    </span>
                                                    <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-300/30">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateTaskField(i, 'type', 'TASK')}
                                                            className={`px-3 py-1 rounded-md text-[11px] font-black transition-all uppercase tracking-wider ${t.type === 'TASK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                        >
                                                            Công việc
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateTaskField(i, 'type', 'SESSION')}
                                                            className={`px-3 py-1 rounded-md text-[11px] font-black transition-all uppercase tracking-wider ${t.type === 'SESSION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                        >
                                                            Phiên học
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteTaskRow(i)}
                                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Xóa công việc này"
                                                >
                                                    <Trash size={16} weight="bold" />
                                                </button>
                                            </div>

                                            <div className="space-y-1.5 text-left">
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    {t.type === 'SESSION' ? 'Tên phiên học' : 'Tên công việc'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={t.title}
                                                    onChange={e => updateTaskField(i, 'title', e.target.value)}
                                                    placeholder="VD: Ôn tập chương 1..."
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none text-[14px] font-bold text-slate-800 transition-all shadow-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                                <div className="space-y-1.5">
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Độ ưu tiên</label>
                                                    <select
                                                        value={t.priority}
                                                        onChange={e => updateTaskField(i, 'priority', parseInt(e.target.value))}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none text-[14px] font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
                                                    >
                                                        <option value={1}>Thấp</option>
                                                        <option value={2}>Bình thường</option>
                                                        <option value={3}>Cao</option>
                                                        <option value={4}>Rất cao</option>
                                                    </select>
                                                </div>

                                                {t.type === 'TASK' ? (
                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Hạn chót (Due Date)</label>
                                                        <input
                                                            type="datetime-local"
                                                            value={t.deadline}
                                                            onChange={e => updateTaskField(i, 'deadline', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none text-[13px] font-semibold text-slate-700 transition-all shadow-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1.5">
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Bắt đầu</label>
                                                            <input
                                                                type="datetime-local"
                                                                value={t.startTime}
                                                                onChange={e => updateTaskField(i, 'startTime', e.target.value)}
                                                                className="w-full px-3 py-3 bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none text-[12px] font-semibold text-slate-700 transition-all shadow-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Kết thúc</label>
                                                            <input
                                                                type="datetime-local"
                                                                value={t.endTime}
                                                                onChange={e => updateTaskField(i, 'endTime', e.target.value)}
                                                                className="w-full px-3 py-3 bg-white border border-slate-200 focus:border-indigo-400 rounded-xl outline-none text-[12px] font-semibold text-slate-700 transition-all shadow-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {editedTasks.length === 0 && (
                                        <div className="text-center py-12 bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 space-y-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                                                <Warning size={22} />
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-black text-slate-800">Không có công việc nào</h4>
                                                <p className="text-[12px] text-slate-400 font-bold mt-1">Danh sách công việc đang trống. Hãy nhấn nút bên dưới để thêm mới.</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={addTaskRow}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/20 hover:bg-indigo-50/30 text-indigo-600 rounded-[20px] text-[13px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Plus size={16} weight="bold" className="group-hover:scale-110 transition-transform" />
                                        Thêm công việc học tập mới
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setPreview(null)} className="flex-1 py-4 font-black text-[13px] uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-[20px] transition-all active:scale-[0.98] border border-slate-200/50">
                                    Hủy & Sửa đổi
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-[20px] font-black text-[13px] uppercase tracking-wider shadow-lg shadow-emerald-100 hover:shadow-xl hover:shadow-emerald-200/60 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {isSaving ? <CircleNotch size={18} className="animate-spin" /> : <Check size={18} weight="bold" />}
                                    {isSaving ? "Đang lưu hệ thống..." : "Xác nhận & Lưu lịch"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
