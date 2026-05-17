import React, { useState, useRef } from 'react';
import { X, UploadSimple, File as FileIcon, Trash, Spinner } from '@phosphor-icons/react';
import { useUploadAttachments, useDeleteAttachment } from '@/hooks/useScheduler';
import type { TaskAttachment } from '@/types/api';

interface UploadEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  groupId?: string;
  existingAttachments?: TaskAttachment[];
}

export function UploadEvidenceModal({ isOpen, onClose, taskId, groupId, existingAttachments = [] }: UploadEvidenceModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachments = useUploadAttachments();
  const deleteAttachment = useDeleteAttachment();

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => f.size <= 5 * 1024 * 1024);
      if (validFiles.length < selectedFiles.length) {
        setError('Một số file vượt quá dung lượng tối đa 5MB và đã bị loại bỏ.');
      } else {
        setError(null);
      }
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExisting = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    setError(null);
    try {
      await deleteAttachment.mutateAsync({ taskId, attachmentId, groupId });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa file.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Vui lòng chọn ít nhất một file.');
      return;
    }
    setError(null);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      await uploadAttachments.mutateAsync({ taskId, formData, groupId });
      setFiles([]);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi upload.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <UploadSimple size={20} className="text-blue-600" weight="bold" />
            Nộp & cập nhật minh chứng
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadSimple size={24} className="text-blue-600" weight="bold" />
            </div>
            <p className="text-sm font-bold text-gray-700">Bấm để chọn file nộp thêm</p>
            <p className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG, PDF, DOCX (Max: 5MB/file)</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
            />
          </div>

          {error && <p className="text-sm text-red-500 mt-3 font-medium text-center">{error}</p>}

          {/* List of already uploaded files */}
          {existingAttachments.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tệp đã nộp ({existingAttachments.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {existingAttachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 bg-blue-50/30 rounded-xl border border-blue-100/40">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileIcon size={18} className="text-blue-500 shrink-0" weight="fill" />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-blue-600 truncate block">
                          {att.fileName}
                        </span>
                        <p className="text-[9px] text-gray-400">
                          {att.fileSize ? `${(att.fileSize / 1024 / 1024).toFixed(2)} MB` : '---'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteExisting(att.id)}
                      disabled={deletingId === att.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                      title="Xóa tệp"
                    >
                      {deletingId === att.id ? (
                        <Spinner size={14} className="animate-spin" />
                      ) : (
                        <Trash size={14} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of files selected for upload */}
          {files.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tệp chuẩn bị nộp thêm ({files.length})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileIcon size={18} className="text-gray-400 shrink-0" weight="fill" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                        <p className="text-[9px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-xs"
            >
              Hủy
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploadAttachments.isPending}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
            >
              {uploadAttachments.isPending ? <Spinner size={16} className="animate-spin" /> : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
