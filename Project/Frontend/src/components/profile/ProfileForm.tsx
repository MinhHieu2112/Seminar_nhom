'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/schemas';
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile';

export function ProfileForm() {
  const { data: user, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      timezone: user?.timezone || '',
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        timezone: user.timezone || '',
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile({
      timezone: data.timezone || undefined,
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/4 rounded bg-gray-200" />
          <div className="h-10 rounded bg-gray-200" />
          <div className="h-10 w-24 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Read-only Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
      </div>

      {/* Read-only Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <input
          type="text"
          value={user?.role || ''}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 capitalize"
        />
      </div>

      {/* Timezone */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
          Timezone
        </label>
        <input
          {...register('timezone')}
          id="timezone"
          type="text"
          placeholder="Asia/Ho_Chi_Minh"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.timezone && (
          <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Example: Asia/Ho_Chi_Minh, America/New_York, Europe/London
        </p>
      </div>

      {/* Account Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Account Status
        </label>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              user?.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {user?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Member Since */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Member Since
        </label>
        <p className="mt-1 text-sm text-gray-600">
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : '-'}
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!isDirty || isUpdating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
        {isDirty && (
          <button
            type="button"
            onClick={() => reset({ timezone: user?.timezone || '' })}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
