import React, { useState, useRef } from 'react';
import { X, Sparkle, Image as ImageIcon, Warning, CircleNotch, Paperclip, Check } from '@phosphor-icons/react';
import { useGenerateAiScheduleFromPrompt, useGenerateAiScheduleFromImage, useCreateAiScheduleBatch, AiSchedulePreview } from '@/hooks/useAiGenerator';

interface AiScheduleModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AiScheduleModal({ onClose, onSuccess }: AiScheduleModalProps) {
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
        }
    };

    const handleGenerate = async () => {
        setErrorInfo(null);
        setPreview(null);
        try {
            if (file) {
                const res = await generateFromImageMutation.mutateAsync({ file, prompt });
                setPreview(res);
            } else if (prompt.trim()) {
                const res = await generateFromPromptMutation.mutateAsync(prompt);
                setPreview(res);
            } else {
                setErrorInfo("Vui lòng nhập nội dung hoặc tải ảnh lên.");
            }
        } catch (err: unknown) {
            // if backend passes clear list of missing fields, it will be in the message
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            setErrorInfo(error.response?.data?.message || error.message || "Failed to generate schedule.");
        }
    };

    const handleSave = async () => {
        if (!preview) return;
        try {
            await createBatchMutation.mutateAsync(preview);
            onSuccess();
        } catch {
            setErrorInfo("Failed to save schedule.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh] md:h-auto md:max-h-[85vh]">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                            <Sparkle weight="fill" size={20} />
                        </div>
                        <div>
                            <h2 className="text-[20px] font-black text-white">Trợ lý AI Scheduler</h2>
                            <p className="text-[13px] text-white/80 font-medium mt-0.5">Tạo lịch tự động bằng ngôn ngữ tự nhiên hoặc từ ảnh</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <X size={20} weight="bold" />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto bg-slate-50">

                    {errorInfo && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600">
                            <Warning size={20} weight="fill" className="shrink-0 mt-0.5" />
                            <div className="text-[14px] font-medium leading-relaxed">{errorInfo}</div>
                        </div>
                    )}

                    {!preview ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Lời nhắc (Prompt)</label>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="VD: Tuần sau tôi thi Toán và Lý, lên lịch học 2 tiếng mỗi ngày vào buổi tối..."
                                    rows={4}
                                    className="w-full p-4 bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-2xl outline-none text-[15px] font-medium text-slate-800 transition-all resize-none shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-2">Tải ảnh lên (Tùy chọn)</label>
                                <div
                                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50'}`}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                                    {file ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <ImageIcon size={32} weight="duotone" className="text-indigo-500" />
                                            <span className="text-[14px] font-bold text-indigo-700">{file.name}</span>
                                            <button onClick={() => setFile(null)} className="text-[12px] font-bold text-slate-500 hover:text-red-500 mt-2 hover:underline">Xóa ảnh</button>
                                        </div>
                                    ) : (
                                        <div className="cursor-pointer flex flex-col items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-1">
                                                <Paperclip size={20} weight="bold" />
                                            </div>
                                            <span className="text-[14px] font-bold text-slate-600">Nhấn để chọn ảnh</span>
                                            <span className="text-[12px] text-slate-400">Hỗ trợ JPG, PNG (Hóa đơn, thời khóa biểu...)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || (!prompt.trim() && !file)}
                                className="w-full py-4 mt-4 bg-slate-900 text-white rounded-2xl font-black text-[15px] shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <><CircleNotch size={18} weight="bold" className="animate-spin" /> Đang phân tích...</>
                                ) : (
                                    <><Sparkle size={18} weight="fill" /> Tạo lịch trình</>
                                )}
                            </button>
                        </div>
                    ) : (
                        // Preview View
                        <div className="animate-in slide-in-from-right-4">
                            <div className="mb-6">
                                <h3 className="text-[18px] font-black text-slate-800 mb-1">Kết quả dự kiến</h3>
                                <p className="text-[13px] text-slate-500 font-medium">Kiểm tra thông tin trước khi lưu vào hệ thống</p>
                            </div>

                            <div className="bg-white border text-center border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Mục tiêu / Subject</div>
                                <div className="text-[18px] font-bold text-indigo-600 mb-4">{preview.goalTitle}</div>

                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4 text-left">Công việc ({preview.tasks.length})</div>
                                <div className="space-y-2">
                                    {preview.tasks.map((t, i) => (
                                        <div key={i} className="flex flex-col text-left sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <div className="text-[14px] font-bold text-slate-800">{t.title}</div>
                                                {t.deadline && <div className="text-[12px] text-red-500 font-semibold mt-0.5">Hạn chót: {t.deadline}</div>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                <span className="text-[11px] font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded-lg">{t.duration} phút</span>
                                                <span className="text-[11px] font-bold px-2 py-1 bg-orange-100 text-orange-600 rounded-lg">P{t.priority}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setPreview(null)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-200/50 rounded-xl hover:bg-slate-200 transition-colors">
                                    Hủy & Sửa đổi
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                    {isSaving ? <CircleNotch size={18} className="animate-spin" /> : <Check size={18} weight="bold" />}
                                    {isSaving ? "Đang lưu..." : "Xác nhận & Lưu"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
