
// Fix: Added OrderStatus enum to support typed order states across the app
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Fix: Added Review interface to support product reviews in constants and detail page
export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  productId: number;
  userId: number;
  user?: User; // Để lấy avatar/name từ đây
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash?: string;
  role: 'customer' | 'staff' | 'admin';
  created_at?: string;
  avatar?: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'order' | 'promo' | 'system';
  isRead: boolean;
}

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

// Product Image
export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
}

// Product (Định nghĩa lại hoàn toàn)
export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  discount: number;
  stock: number;
  material: string;
  dimension: string;
  weight: number;
  description: string;
  status: 'active' | 'inactive';
  rating: number;
  createdAt: string;
  categoryId: number;
  category?: Category;      // Object thay vì string
  images: ProductImage[];   // Array object thay vì array string
  reviews?: Review[];
}

export interface DiscountCode {
  code: string;
  value: number;
  type: 'percent' | 'fixed';
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string;
  created_at: string;
  items?: any[];
  date?: string;
  total?: number;
  discount_applied?: number;
}

export interface Service {
  id: string;
  name: string;
  base_price: number;
  description: string;
}

export interface ServiceRequest {
  id: string;
  user_id: string;
  service_id: string;
  area: number;
  budget: number;
  note: string;
  status: 'new' | 'consulting' | 'quoted' | 'contracted' | 'done';
  created_at?: string;
}

// Định nghĩa cấu trúc cho từng tấm ảnh của dự án
export interface ProjectImage {
  id: number;
  projectId: number;
  imageUrl: string; // Sử dụng imageUrl thay vì url để khớp với Prisma
}

// Cập nhật Interface Project chính
export interface Project {
  id: number;
  name: string;
  location: string;
  area: number;
  style: string;
  completedYear: number;
  description: string;
  images: ProjectImage[]; 
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
