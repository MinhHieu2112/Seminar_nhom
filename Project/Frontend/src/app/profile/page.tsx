'use client';

import {
  FloppyDisk,
  SpinnerGap,
  ShieldCheck,
  GoogleLogo,
  GithubLogo,
  FacebookLogo,
  LinkedinLogo,
  CheckCircle,
  Link,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/schemas';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ProfileSummary } from '@/components/profile/ProfileSummary';
import { PersonalInfoCard } from '@/components/profile/PersonalInfoCard';
import { AddressCard } from '@/components/profile/AddressCard';
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile';
import toast from 'react-hot-toast';
import type { User } from '@/types/api';

// ─── Security Tab ──────────────────────────────────────────────────────────────

function SecurityTab({ user }: { user: User | null | undefined }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPw, setIsSavingPw] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setIsSavingPw(true);
    // TODO: call change-password API
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Đã đổi mật khẩu thành công');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSavingPw(false);
  };

  // Linked providers — derive from user object (add more fields to User type as needed)
  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleLogo size={26} weight="fill" className="text-[#EA4335]" />,
      linked: !!user?.googleId,
      loginUrl: '/api/v1/auth/google',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <GithubLogo size={26} weight="fill" className="text-gray-800" />,
      linked: !!user?.githubId,
      loginUrl: '/api/v1/auth/github',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FacebookLogo size={26} weight="fill" className="text-[#1877F2]" />,
      linked: !!user?.facebookId,
      loginUrl: '/api/v1/auth/facebook',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <LinkedinLogo size={26} weight="fill" className="text-[#0077B5]" />,
      linked: !!user?.linkedinId,
      loginUrl: '/api/v1/auth/linkedin',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── Form 1: Change Password ── */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
            <p className="text-gray-400 text-sm">Đặt mật khẩu mạnh để bảo vệ tài khoản của bạn</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <PwField
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
          />
          <PwField
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Tối thiểu 8 ký tự"
          />
          <PwField
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
          />
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingPw || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSavingPw ? (
                <SpinnerGap className="animate-spin" size={16} />
              ) : (
                <FloppyDisk size={16} />
              )}
              Lưu mật khẩu
            </button>
          </div>
        </form>
      </div>

      {/* ── Form 2: Linked Social Accounts ── */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
            <Link size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tài khoản liên kết</h3>
            <p className="text-gray-400 text-sm">Quản lý các tài khoản mạng xã hội đã kết nối</p>
          </div>
        </div>

        <div className="space-y-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all bg-gray-50/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  {provider.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{provider.name}</p>
                  {provider.linked ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
                      <CheckCircle size={12} weight="fill" /> Đã liên kết
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 mt-0.5 block">Chưa liên kết</span>
                  )}
                </div>
              </div>

              {provider.linked ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-lg transition"
                >
                  Huỷ liên kết
                </button>
              ) : (
                <a
                  href={provider.loginUrl}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-100 hover:border-purple-300 bg-white px-3 py-1.5 rounded-lg transition"
                >
                  Liên kết
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PwField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-gray-500 text-sm font-medium block">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none py-2.5 px-3.5 rounded-xl text-gray-900 text-sm transition-all"
      />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function ProfileContent() {
  const { data: user, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'security'>('overview');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      bio: user?.bio || '',
      coverPhoto: user?.coverPhoto || '',
      timezone: user?.timezone || '',
      country: user?.country || '',
      city: user?.city || '',
      postalCode: user?.postalCode || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      dob: user?.dob || '',
      phone: user?.phone || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        bio: user.bio || '',
        coverPhoto: user.coverPhoto || '',
        timezone: user.timezone || '',
        country: user.country || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dob: user.dob || '',
        phone: user.phone || '',
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile(
      {
        bio: data.bio || undefined,
        timezone: data.timezone || undefined,
        country: data.country || undefined,
        city: data.city || undefined,
        postalCode: data.postalCode || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        dob: data.dob || undefined,
        phone: data.phone || undefined,
      },
      {
        onSuccess: () => toast.success('Đã lưu thay đổi hồ sơ'),
        onError: () => toast.error('Không thể lưu thay đổi. Vui lòng thử lại.'),
      }
    );
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerGap className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  const tabClass = (tabId: string) =>
    `pb-4 font-bold text-[15px] transition-colors border-b-2 px-1 ${activeTab === tabId
      ? 'border-purple-600 text-purple-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  const showSaveButton = activeTab !== 'security';

  return (
    <div className="w-full pb-24 -mt-4 lg:-mt-8 -mx-4 lg:-mx-8 px-4 lg:px-8">
      {/* Profile Header Block */}
      <ProfileSummary user={user} />

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200 mb-8 px-4 mt-6">
        <button type="button" onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
          Tổng quan
        </button>
        <button type="button" onClick={() => setActiveTab('personal')} className={tabClass('personal')}>
          Thông tin cá nhân
        </button>
        <button type="button" onClick={() => setActiveTab('security')} className={tabClass('security')}>
          Bảo mật
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'security' ? (
        <div className="px-4">
          <SecurityTab user={user} />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="px-4">
          {/* VIEW: Tổng quan */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Giới thiệu bản thân</h3>
                <div>
                  <label className="block tracking-wide text-gray-500 text-xs font-bold mb-3 uppercase">
                    Tóm tắt (Bio)
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={6}
                    placeholder="Viết một vài dòng giới thiệu về bạn..."
                    className="w-full bg-gray-50 border-0 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-purple-600 block p-4 transition-all"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Thông tin cá nhân */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <PersonalInfoCard user={user} register={register} errors={errors} />
              <AddressCard user={user} register={register} errors={errors} />
            </div>
          )}

          {/* Save Button — always shown in overview / personal tabs */}
          {showSaveButton && (
            <div className="mt-10 flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center gap-2 bg-gray-900 border border-gray-800 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <SpinnerGap className="animate-spin" size={18} />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <FloppyDisk size={18} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
