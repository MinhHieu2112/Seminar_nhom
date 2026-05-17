'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { UpdateProfileFormData } from '@/lib/schemas';

interface AddressCardProps {
  register: UseFormRegister<UpdateProfileFormData>;
  errors: FieldErrors<UpdateProfileFormData>;
}

export function AddressCard({ register, errors }: AddressCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-bold text-[#024230]">Địa chỉ</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
        <InfoInput 
          label="Quốc gia" 
          name="country"
          register={register}
          error={errors.country?.message}
        />
        <InfoInput 
          label="Nơi sinh sống" 
          name="city"
          register={register}
          error={errors.city?.message}
        />
        <InfoInput 
          label="Mã bưu chính" 
          name="postalCode"
          register={register}
          error={errors.postalCode?.message}
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
  type = "text" 
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
