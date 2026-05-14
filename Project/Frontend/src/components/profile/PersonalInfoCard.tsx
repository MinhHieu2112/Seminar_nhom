'use client';

import { User } from '@/types/api';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { UpdateProfileFormData } from '@/lib/schemas';

interface PersonalInfoCardProps {
  user?: User;
  register: UseFormRegister<UpdateProfileFormData>;
  errors: FieldErrors<UpdateProfileFormData>;
}

export function PersonalInfoCard({ user, register, errors }: PersonalInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-bold text-[#024230]">Personal Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
        <InfoInput
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName?.message}
        />
        <InfoInput
          label="Last Name"
          name="lastName"
          register={register}
          error={errors.lastName?.message}
        />
        <InfoInput
          label="Date of Birth"
          name="dob"
          type="date"
          register={register}
          error={errors.dob?.message}
        />
        <div className="space-y-1.5 opacity-60">
          <p className="text-gray-400 text-sm font-medium">Email Address</p>
          <p className="text-gray-900 font-bold">{user?.email || 'hh@gmail.com'}</p>
        </div>
        <InfoInput
          label="Phone Number"
          name="phone"
          register={register}
          error={errors.phone?.message}
        />
      </div>
    </div>
  );
}

function InfoInput({
  label,
  name,
  register,
  error,
  type = 'text',
}: {
  label: string;
  name: keyof UpdateProfileFormData;
  register: UseFormRegister<UpdateProfileFormData>;
  error?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <input
        {...register(name)}
        type={type}
        className={`w-full bg-gray-50 border-b-2 border-transparent hover:border-gray-200 focus:border-[#024230] focus:bg-white outline-none py-1 transition-all text-gray-900 font-bold rounded-t-lg px-2 ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
