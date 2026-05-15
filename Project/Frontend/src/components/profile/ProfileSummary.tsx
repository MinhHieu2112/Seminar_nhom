'use client';

import { Camera, MapPin } from '@phosphor-icons/react';
import { useUploadAvatar } from '@/hooks/useProfile';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import type { User } from '@/types/api';

export function ProfileSummary({ user }: { user: User | null | undefined }) {
  const { mutateAsync: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 2MB');
      return;
    }

    try {
      await uploadAvatar(file);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const coverPhoto = user?.coverPhoto || 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=2071&auto=format&fit=crop';
  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || user?.email || 'User'}&background=random`;

  return (
    <div className="relative mb-6 bg-white shadow-sm overflow-hidden flex flex-col border border-gray-100 rounded-2xl">
      {/* Cover Photo */}
      <div
        className="h-52 w-full bg-cover bg-center bg-gray-200 relative group"
        style={{ backgroundImage: `url(${coverPhoto})` }}
      >
        <button className="absolute top-4 right-4 bg-white/50 hover:bg-white/90 backdrop-blur-md text-gray-800 p-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-sm opacity-0 group-hover:opacity-100">
          <Camera size={16} /> Thay ảnh bìa
        </button>
      </div>

      {/* Profile Bar */}
      <div className="px-10 pb-7 bg-white flex flex-col md:flex-row items-center md:items-start gap-6 relative -mt-16">

        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
            {isUploading ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Image 
                src={avatarUrl} 
                alt="Avatar" 
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="absolute bottom-2 right-2 p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 hover:scale-105 transition-all shadow-md"
          >
            <Camera size={16} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Info */}
        <div className="pt-20 md:pt-16 flex-1 text-center md:text-left">
          <h2 className="text-2xl font-extrabold text-gray-900">
            {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name || user?.email}
          </h2>

          <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500 font-medium">
            {user?.city && user?.country && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} /> {user.city}, {user.country}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
