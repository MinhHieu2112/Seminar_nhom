import React, { useState } from 'react';
import { X, Users, Spinner } from '@phosphor-icons/react';
import { useCreateGroup } from '@/hooks/useGroups';

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createGroupMutation = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên nhóm không được để trống');
      return;
    }

    try {
      const newGroup = await createGroupMutation.mutateAsync({ name, description });
      if (newGroup && newGroup.id) {
        onSuccess?.(newGroup.id);
        onClose();
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Có lỗi xảy ra khi tạo nhóm');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3 text-blue-600">
            <Users size={24} weight="fill" />
            <h2 className="font-bold text-lg text-gray-900 tracking-tight">Tạo nhóm mới</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Tên nhóm <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="VD: Nhóm học Lập trình Web"
              disabled={createGroupMutation.isPending}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[100px] resize-y"
              placeholder="Thêm mô tả ngắn gọn về nhóm..."
              disabled={createGroupMutation.isPending}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={createGroupMutation.isPending}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/30 disabled:opacity-70"
            >
              {createGroupMutation.isPending ? (
                <>
                  <Spinner className="animate-spin" size={18} />
                  Đang tạo...
                </>
              ) : (
                'Tạo nhóm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
