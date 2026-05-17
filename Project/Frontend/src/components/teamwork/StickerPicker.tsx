import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Smiley, Spinner } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';

export interface Sticker {
  id: string;
  url: string;
  tags: string[];
}

interface StickerPickerProps {
  onSelect: (sticker: { id: string; url: string; packName: string }) => void;
  onClose: () => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stickers dynamically from secure backend Giphy proxy
  useEffect(() => {
    const fetchStickers = async () => {
      setIsLoading(true);
      try {
        let url = '';
        if (searchQuery.trim()) {
          url = `/api/v1/teamwork/stickers/search?q=${encodeURIComponent(searchQuery)}`;
        } else {
          url = `/api/v1/teamwork/stickers/trending`;
        }

        const res = await apiClient.get<any>(url);
        const stickerList = res.data?.body?.stickerList;
        if (stickerList && stickerList.length > 0) {
          const formatted = stickerList.map((s: any) => ({
            id: `giphy_${s.stickerId}`,
            url: s.stickerImg,
            tags: s.keyword ? [s.keyword] : [],
          }));
          setStickers(formatted);
        } else {
          setStickers([]);
        }
      } catch (err) {
        console.error('Failed to fetch from backend Giphy proxy:', err);
        setStickers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchStickers, searchQuery.trim() ? 500 : 0);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="w-80 h-96 bg-white border border-gray-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Search Header */}
      <div className="p-3 border-b border-gray-50 flex items-center gap-2">
        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2 border border-gray-100 focus-within:border-blue-400 focus-within:bg-white transition-all">
          <MagnifyingGlass size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm sticker trên Giphy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400 font-medium"
          />
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="h-full flex items-center justify-center py-12">
              <Spinner size={24} className="animate-spin text-blue-500" />
            </div>
          ) : stickers.length > 0 ? (
            <motion.div
              key={searchQuery ? 'search' : 'trending'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-3 gap-3"
            >
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => onSelect({ id: sticker.id, url: sticker.url, packName: 'Giphy' })}
                  className="aspect-square bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 rounded-2xl p-1.5 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm group"
                >
                  <img
                    src={sticker.url}
                    alt={sticker.id}
                    className="w-full h-full object-contain group-hover:drop-shadow-md"
                    loading="lazy"
                  />
                </button>
              ))}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
              <Smiley size={32} className="mb-2 text-gray-300" />
              <p className="text-xs font-bold">Không tìm thấy sticker nào</p>
              <p className="text-[10px] mt-0.5">Thử nhập từ khóa tiếng Anh khác (e.g. "happy", "love", "cat"...)</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <div className="bg-white border-t border-gray-50 px-4 py-2.5 flex items-center justify-between text-[10px] font-bold text-gray-400">
        <span>Giphy Sticker Integration</span>
        <span className="text-blue-500 font-extrabold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          API Active
        </span>
      </div>
    </div>
  );
}
