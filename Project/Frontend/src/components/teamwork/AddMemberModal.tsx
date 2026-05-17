'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Spinner, MagnifyingGlass, Check, Warning, User } from '@phosphor-icons/react';
import { useInviteGroupMember } from '@/hooks/useGroups';
import { useSearchUsers } from '@/hooks/useProfile';
import type { Group, User as UserType } from '@/types/api';

interface AddMemberModalProps {
  group: Group;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddMemberModal({ group, onClose, onSuccess }: AddMemberModalProps) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('member');
  const [results, setResults] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inviteMutation = useInviteGroupMember();
  const searchMutation = useSearchUsers();

  // Debounce search
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(async () => {
      try {
        const data = await searchMutation.mutateAsync(query);
        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMutation, searchMutation.mutateAsync]);

  const handleInvite = async () => {
    if (!selectedUser) return;
    
    try {
      await inviteMutation.mutateAsync({ 
        groupId: group.id, 
        data: { userId: selectedUser.id, role } 
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời');
    }
  };

  const isAlreadyMember = (userId: string) => {
    return group.members?.some((m) => m.userId === userId);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">Mời thành viên vào {group.name}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-hidden">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Tìm kiếm theo tên hoặc email</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <MagnifyingGlass size={20} />
              </div>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (!val.trim()) {
                    setResults([]);
                  }
                  setSelectedUser(null);
                  setError(null);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="Tên, Gmail, hoặc tên người dùng..."
              />
              {searchMutation.isPending && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Spinner size={18} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg min-h-[200px] bg-gray-50/30">
            {results.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {results.map((user) => {
                  const alreadyMember = isAlreadyMember(user.id);
                  const isSelected = selectedUser?.id === user.id;
                  
                  return (
                    <div
                      key={user.id}
                      onClick={() => !alreadyMember && setSelectedUser(user)}
                      className={`flex items-center gap-4 p-4 transition-colors ${
                        alreadyMember ? 'opacity-50 cursor-not-allowed bg-gray-50' : 
                        isSelected ? 'bg-blue-50 cursor-pointer' : 'hover:bg-white cursor-pointer'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                            <User size={20} weight="fill" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {alreadyMember ? (
                          <span className="text-[10px] font-black text-gray-400 border border-gray-200 px-2 py-1 rounded-md bg-gray-100">
                            ĐÃ TRONG NHÓM
                          </span>
                        ) : isSelected ? (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            <Check size={12} weight="bold" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-blue-600 border border-blue-200 px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white transition-colors">
                            CHỌN
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : query.trim() && !searchMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Warning size={32} weight="duotone" className="mb-2" />
                <p className="text-sm font-medium">Không tìm thấy người dùng nào</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <MagnifyingGlass size={32} weight="duotone" className="mb-2" />
                <p className="text-xs font-medium">Nhập thông tin để tìm kiếm thành viên</p>
              </div>
            )}
          </div>

          {/* Role selection & Footer */}
          {selectedUser && (
            <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-gray-700">Vai trò:</p>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Thành viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                 {error && <span className="text-xs text-red-500 font-medium mr-2">{error}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedUser || inviteMutation.isPending}
            className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            {inviteMutation.isPending ? (
              <>
                <Spinner size={16} className="animate-spin" />
                Đang mời...
              </>
            ) : (
              <>
                <UserPlus size={18} weight="bold" />
                Mời vào nhóm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
