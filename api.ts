
import { Product, Project, Service, Order, User, OrderStatus, Review } from './types';
import { PRODUCTS } from './constants';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const MOCK_USER: User = {
  id: 'u1',
  name: 'Khách hàng LuxDecor',
  email: 'user@example.com',
  phone: '0123456789',
  role: 'customer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
};

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Villa Riverside Luxury',
    location: 'Quận 7, TP. HCM',
    area: 450,
    style: 'Modern Classic',
    completed_year: 2023,
    description: 'Kiến tạo không gian biệt thự đẳng cấp với sự kết hợp hoàn hảo giữa ánh sáng tự nhiên và nội thất tinh tuyển. Dự án tập trung vào việc phá vỡ ranh giới giữa bên trong và bên ngoài bằng các diện kính lớn và vật liệu tự nhiên cao cấp.',
    images: [
      "/portfolio/project-1/vill-beboi.png",
      "/portfolio/project-1/vill-phongkhach.png",
      "/portfolio/project-1/vill-phongan.png",
      "/portfolio/project-1/vill-work.png",
      "/portfolio/project-1/vill-conlai.png"
    ]
  },
  {
    id: '2',
    name: 'Penthouse Skyline',
    location: 'Quận 2, TP. HCM',
    area: 280,
    style: 'Minimalist',
    completed_year: 2024,
    description: 'Căn hộ tầng mái với thiết kế tối giản, loại bỏ sự rườm rà để tôn vinh giá trị của không gian và sự tĩnh lặng giữa lòng đô thị náo nhiệt. Mọi chi tiết đều được tinh lọc để đạt đến sự hoàn mỹ về thị giác.',
    images: [
      "/portfolio/project-2/penthouse-1.jpg",
      "/portfolio/project-2/penthouse-2.jpg",
      "/portfolio/project-2/penthouse-3.jpg",
      "/portfolio/project-2/penthouse-4.jpg",
    ]
  },
  {
    id: '3',
    name: 'The Regal Reside',
    location: 'TP. Thủ Đức',
    area: 1200,
    style: 'Japanese Fusion',
    completed_year: 2023,
    description: 'The Regal Reside là dự án căn hộ dịch vụ thấp tầng mang đậm dấu ấn kiến trúc đương đại, nơi hình khối táo bạo hòa quyện cùng ngôn ngữ thiết kế tinh giản. Công trình được tạo hình như một “cổng không gian” mở, phá vỡ những khuôn mẫu truyền thống, đồng thời kiến tạo trải nghiệm sống đa tầng – nơi ánh sáng, gió trời và mảng xanh được đưa vào từng nhịp sống thường nhật.',
    images: [
      "/portfolio/project-3/the-legal-1.jpg",
      "/portfolio/project-3/the-legal-2.jpg",
      "/portfolio/project-3/the-legal-3.jpg",
      "/portfolio/project-3/the-legal-4.jpg",
    ]
  },
  {
    id: '4',
    name: 'Homestay In Dalat',
    location: 'Đà Lạt, Lâm Đồng',
    area: 600,
    style: 'Indochine Style',
    completed_year: 2022,
    description: 'Phục dựng và làm mới dinh thự cổ điển với phong cách Đông Dương tinh tế, giữ trọn nét hoài cổ trong nhịp sống hiện đại bằng cách bảo tồn các họa tiết nguyên bản và bổ sung tiện nghi cao cấp.',
    images: [
      "/portfolio/project-4/homestay-1.jpg",
      "/portfolio/project-4/homestay-2.jpg",
      "/portfolio/project-4/homestay-3.jpg",
      "/portfolio/project-4/homestay-4.jpg",
    ]
  }
];

export const api = {
  auth: {
    login: async (credentials: any): Promise<User> => {
      await delay(500);
      return { ...MOCK_USER, email: credentials.email };
    },
    register: async (userData: any): Promise<User> => {
      await delay(800);
      return {
        id: `USR-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'customer',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}`
      };
    }
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      await delay(300);
      return PRODUCTS;
    },
    getById: async (id: string): Promise<Product | undefined> => {
      return PRODUCTS.find(p => p.id === id);
    }
  },

  projects: {
    getAll: async (): Promise<Project[]> => {
      await delay(300);
      return MOCK_PROJECTS;
    },
    getById: async (id: string): Promise<Project | undefined> => {
      await delay(200);
      return MOCK_PROJECTS.find(p => p.id === id);
    }
  },

  services: {
    request: async (data: any): Promise<any> => {
      await delay(500);
      return { id: `REQ-${Date.now()}`, ...data };
    }
  },

  orders: {
    create: async (orderData: any): Promise<Order> => {
      await delay(1000);
      return {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: orderData.user_id,
        total_amount: orderData.total,
        status: OrderStatus.PENDING,
        shipping_address: orderData.address,
        created_at: new Date().toISOString(),
        date: new Date().toLocaleDateString('vi-VN'),
        total: orderData.total,
        items: orderData.items
      };
    },
    getByUser: async (userId: string): Promise<Order[]> => {
      return [];
    }
  },

  reviews: {
    add: async (productId: string, userId: string, reviewData: any): Promise<Review> => {
      return {
        id: `REV-${Date.now()}`,
        ...reviewData,
        date: new Date().toLocaleDateString('vi-VN')
      };
    }
  }
};
