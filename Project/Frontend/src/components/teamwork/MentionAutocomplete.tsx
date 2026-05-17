import React from 'react';
import { Crown, User } from '@phosphor-icons/react';

interface MentionAutocompleteProps {
  members: any[];
  searchQuery: string;
  onSelect: (user: { id: string; name: string }) => void;
}

export function MentionAutocomplete({ members, searchQuery, onSelect }: MentionAutocompleteProps) {
  const filteredMembers = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return members.slice(0, 5); // Show first 5 if query is empty

    return members
      .filter((m) => {
        const name = m.user?.name || '';
        const email = m.user?.email || '';
        return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
      })
      .slice(0, 5);
  }, [members, searchQuery]);

  if (filteredMembers.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="px-3.5 py-2 bg-slate-50/50 border-b border-gray-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Nhắc tên thành viên
        </span>
        <span className="text-[9px] text-gray-400 font-medium">↑↓ để duyệt, Enter để chọn</span>
      </div>
      <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
        {filteredMembers.map((member) => {
          const user = member.user;
          if (!user) return null;

          const isLeader = member.role === 'LEADER' || member.role === 'creator';

          return (
            <button
              key={member.id}
              onClick={() => onSelect({ id: user.id, name: user.name || 'Thành viên' })}
              className="w-full px-3 py-2 text-left rounded-xl hover:bg-blue-50/40 flex items-center gap-2.5 transition-all group active:scale-[0.98]"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-gray-100 group-hover:border-blue-200 transition-all"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-gray-50 text-slate-400 group-hover:bg-blue-50 transition-all">
                  <User size={14} weight="bold" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 truncate transition-colors">
                    {user.name}
                  </span>
                  {isLeader && (
                    <Crown size={12} weight="fill" className="text-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
