import React, { useState, useRef } from 'react';
import { X, Sparkle, Image as ImageIcon, Warning, CircleNotch, Paperclip, Check, FileText } from '@phosphor-icons/react';
import { useGenerateAiScheduleFromPrompt, useGenerateAiScheduleFromImage, useCreateAiScheduleBatch, AiSchedulePreview } from '@/hooks/useAiGenerator';

interface AiScheduleModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AiScheduleModal({ onClose, onSuccess }: AiScheduleModalProps) {
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<AiSchedulePreview | null>(null);
    const [errorInfo, setErrorInfo] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateFromPromptMutation = useGenerateAiScheduleFromPrompt();
    const generateFromImageMutation = useGenerateAiScheduleFromImage();
    const createBatchMutation = useCreateAiScheduleBatch();

    const isGenerating = generateFromPromptMutation.isPending || generateFromImageMutation.isPending;
    const isSaving = createBatchMutation.isPending;

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
            if (mode === 'image') {
                if (!file) {
                    setErrorInfo("Vui lòng tải ảnh lên để bắt đầu.");
                    return;
                }
                const res = await generateFromImageMutation.mutateAsync({ file, prompt });
                setPreview(res);
            } else {
                if (!prompt.trim()) {
                    setErrorInfo("Vui lòng nhập lời nhắc để AI có thể giúp bạn.");
                    return;
                }
                const res = await generateFromPromptMutation.mutateAsync(prompt);
                setPreview(res);
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setErrorInfo(error.response?.data?.message || error.message || "Không thể tạo lịch trình. Vui lòng thử lại.");
        }
    };

    const handleSave = async () => {
        if (!preview) return;
        try {
            await createBatchMutation.mutateAsync(preview);
            onSuccess();
        } catch {
            setErrorInfo("Lưu lịch trình thất bại.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh] md:h-auto md:max-h-[85vh] border border-white/20">

                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl border border-white/30 shadow-lg animate-pulse">
                            <Sparkle weight="fill" size={24} />
                        </div>
                        <div>
                            <h2 className="text-[24px] font-black text-white tracking-tight">Trợ lý AI Scheduler</h2>
                            <p className="text-[14px] text-white/90 font-medium opacity-90">
                                {mode === 'text' ? 'Tạo lịch trình qua văn bản' : 'Trích xuất công việc từ hình ảnh'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all hover:rotate-90 relative z-10 border border-white/20">
                        <X size={20} weight="bold" />
                    </button>
                </div>

                <div className="p-10 flex-1 overflow-y-auto bg-slate-50/50">

                    {errorInfo && (
                        <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-[20px] flex items-start gap-4 text-red-600 animate-in slide-in-from-top-2">
                            <Warning size={22} weight="fill" className="shrink-0 mt-0.5" />
                            <div className="text-[14px] font-semibold leading-relaxed">{errorInfo}</div>
                        </div>
                    )}

                    {!preview ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Mode Selection Tabs */}
                            <div className="flex p-1.5 bg-slate-200/60 rounded-[22px] mb-8 border border-slate-200/50">
                                <button
                                    onClick={() => { setMode('text'); setErrorInfo(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] text-[14px] font-black transition-all ${mode === 'text' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <FileText weight={mode === 'text' ? "fill" : "bold"} size={18} />
                                    Nhập văn bản
                                </button>
                                <button
                                    onClick={() => { setMode('image'); setErrorInfo(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] text-[14px] font-black transition-all ${mode === 'image' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <ImageIcon weight={mode === 'image' ? "fill" : "bold"} size={18} />
                                    Quét từ ảnh
                                </button>
                            </div>

                            {mode === 'text' ? (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                            <label className="block text-[14px] font-black text-slate-800 tracking-wide uppercase opacity-70">Lời nhắc (Prompt)</label>
                                        </div>
                                        <textarea
                                            value={prompt}
                                            onChange={e => setPrompt(e.target.value)}
                                            placeholder="VD: Tuần sau tôi thi Toán và Lý, lên lịch học 2 tiếng mỗi ngày vào buổi tối..."
                                            rows={5}
                                            className="w-full p-5 bg-slate-50/50 border border-slate-100 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-[20px] outline-none text-[16px] font-medium text-slate-800 transition-all resize-none"
                                        />
                                        <p className="mt-4 text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                                            <Sparkle size={14} className="text-indigo-400" />
                                            Gợi ý: Hãy cung cấp tên môn học, thời gian rảnh và mục tiêu của bạn.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                                            <label className="block text-[14px] font-black text-slate-800 tracking-wide uppercase opacity-70">Tải ảnh lên</label>
                                        </div>
                                        
                                        <div
                                            className={`border-3 border-dashed rounded-[24px] p-10 text-center transition-all group ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-slate-50'}`}
                                        >
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                                            {file ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-20 h-20 bg-indigo-100 rounded-[20px] flex items-center justify-center text-indigo-600 shadow-inner">
                                                        <ImageIcon size={40} weight="duotone" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[16px] font-black text-slate-800 truncate max-w-[250px]">{file.name}</p>
                                                        <p className="text-[12px] text-slate-400 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <button onClick={() => setFile(null)} className="px-5 py-2 rounded-xl bg-white border border-red-100 text-red-500 text-[13px] font-black hover:bg-red-50 transition-colors shadow-sm">Xóa và chọn lại</button>
                                                </div>
                                            ) : (
                                                <div className="cursor-pointer flex flex-col items-center gap-4 py-4" onClick={() => fileInputRef.current?.click()}>
                                                    <div className="w-16 h-16 bg-white shadow-xl shadow-slate-200/50 rounded-[20px] flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                                                        <Paperclip size={24} weight="bold" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-[16px] font-black text-slate-700">Thả ảnh vào đây hoặc nhấn để chọn</span>
                                                        <span className="text-[13px] text-slate-400 font-medium mt-1 block italic">Hỗ trợ JPG, PNG (Thời khóa biểu, đề cương, hóa đơn...)</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {file && (
                                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2">
                                            <label className="block text-[13px] font-black text-slate-800 mb-3 opacity-70 uppercase tracking-widest">Ghi chú bổ sung (Không bắt buộc)</label>
                                            <input
                                                type="text"
                                                value={prompt}
                                                onChange={e => setPrompt(e.target.value)}
                                                placeholder="VD: Chỉ lấy các môn thi vào tuần sau..."
                                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 focus:border-indigo-400 focus:bg-white rounded-2xl outline-none text-[15px] font-medium"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full py-5 mt-10 bg-slate-900 text-white rounded-[24px] font-black text-[16px] shadow-2xl shadow-slate-900/30 hover:bg-slate-800 hover:shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {isGenerating ? (
                                    <><CircleNotch size={20} weight="bold" className="animate-spin text-indigo-400" /> <span className="tracking-wide uppercase text-[14px]">Đang phân tích dữ liệu...</span></>
                                ) : (
                                    <><Sparkle size={20} weight="fill" className="text-indigo-400" /> <span className="tracking-wide uppercase text-[14px]">Tạo lịch trình ngay</span></>
                                )}
                            </button>
                        </div>
                    ) : (
                        // Preview View
                        <div className="animate-in slide-in-from-right-8 duration-500">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Kết quả dự kiến</h3>
                                    <p className="text-[14px] text-slate-500 font-medium">AI đã trích xuất được các thông tin sau</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Check size={24} weight="bold" />
                                </div>
                            </div>

                            <div className="bg-white border-2 border-slate-100 rounded-[28px] p-8 mb-8 shadow-sm">
                                <div className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-center opacity-60">Chủ đề / Môn học</div>
                                <div className="text-[24px] font-black text-indigo-600 mb-8 text-center bg-indigo-50/50 py-4 px-6 rounded-2xl inline-block w-full">{preview.goalTitle}</div>

                                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                    <div className="text-[14px] font-black text-slate-800 uppercase tracking-widest opacity-70">Danh sách công việc</div>
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[12px] font-black">{preview.tasks.length} items</span>
                                </div>

                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {preview.tasks.map((t, i) => (
                                        <div key={i} className="flex flex-col text-left sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 rounded-[20px] border border-slate-100 group hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="text-[15px] font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{t.title}</div>
                                                {t.deadline && (
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        <span className="text-[12px] text-red-500 font-black">Hạn chót: {t.deadline}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2.5 mt-3 sm:mt-0 shrink-0">
                                                <div className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[12px] font-black shadow-sm flex items-center gap-1.5">
                                                    <CircleNotch size={12} weight="bold" className="text-slate-400" />
                                                    {t.duration}p
                                                </div>
                                                <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl text-[12px] font-black shadow-sm">
                                                    P{t.priority}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button onClick={() => setPreview(null)} className="flex-1 py-5 font-black text-[14px] uppercase tracking-widest text-slate-500 bg-slate-200/50 rounded-[24px] hover:bg-slate-200 transition-all active:scale-[0.98]">
                                    Hủy & Sửa đổi
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[14px] uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {isSaving ? <CircleNotch size={20} className="animate-spin" /> : <Check size={20} weight="bold" />}
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
