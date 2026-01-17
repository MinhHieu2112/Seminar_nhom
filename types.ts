
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
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
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
  id: string;
  name: string;
  parent_id?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  discount: number;
  material: string;
  dimension: string;
  weight: number;
  description: string;
  category_id: string;
  category?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  images: string[];
  rating?: number;
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

export interface Project {
  id: string;
  name: string;
  location: string;
  area: number;
  style: string;
  completed_year: number;
  description: string;
  images: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
