import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // THÊM CẤU HÌNH STORAGE NÀY
    storageKey: 'sb-auth-token', // Phải trùng với tên trong middleware.ts
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        const cookie = document.cookie.split('; ').find(row => row.startsWith(`${key}=`));
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : window.localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        // Lưu vào cả Cookie để Middleware đọc và LocalStorage để Client đọc
        document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
        window.localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        window.localStorage.removeItem(key);
      },
    },
  },
});