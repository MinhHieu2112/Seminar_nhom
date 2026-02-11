import { ProductStatus } from '@prisma/client';

/* ================= PROJECT ================= */
export const PROJECTS = [
  {
    id: 1,
    name: 'Villa Riverside Luxury',
    location: 'Quận 7, TP.HCM',
    area: 450,
    style: 'Modern Classic',
    completedYear: 2023,
    description: 'Kiến tạo không gian biệt thự đẳng cấp...',
  },
  {
    id: 2,
    name: 'Penthouse Skyline',
    location: 'Quận 2, TP. HCM',
    area: 280,
    style: 'Minimalist',
    completedYear: 2024,
    description:
      'Căn hộ tầng mái với thiết kế tối giản, loại bỏ sự rườm rà để tôn vinh giá trị của không gian và sự tĩnh lặng giữa lòng đô thị náo nhiệt. Mọi chi tiết đều được tinh lọc để đạt đến sự hoàn mỹ về thị giác.',
  },
  {
    id: 3,
    name: 'The Regal Reside',
    location: 'TP. Thủ Đức',
    area: 1200,
    style: 'Japanese Fusion',
    completedYear: 2023,
    description:
      'The Regal Reside là dự án căn hộ dịch vụ thấp tầng mang đậm dấu ấn kiến trúc đương đại, nơi hình khối táo bạo hòa quyện cùng ngôn ngữ thiết kế tinh giản. Công trình được tạo hình như một “cổng không gian” mở, phá vỡ những khuôn mẫu truyền thống, đồng thời kiến tạo trải nghiệm sống đa tầng – nơi ánh sáng, gió trời và mảng xanh được đưa vào từng nhịp sống thường nhật.',
  },
  {
    id: 4,
    name: 'Homestay In Dalat',
    location: 'Đà Lạt, Lâm Đồng',
    area: 600,
    style: 'Indochine Style',
    completedYear: 2022,
    description:
      'Phục dựng và làm mới dinh thự cổ điển với phong cách Đông Dương tinh tế, giữ trọn nét hoài cổ trong nhịp sống hiện đại bằng cách bảo tồn các họa tiết nguyên bản và bổ sung tiện nghi cao cấp.',
  },
];

const createProjectImages = (
  projectId: number,
  folder: string,
  images: string[],
) => {
  return images.map((img) => ({
    projectId,
    imageUrl: `${folder}/${img}`,
  }));
};

export const PROJECT_IMAGES = [
  ...createProjectImages(1, '/portfolio/project-1', [
    'vill-beboi.png',
    'vill-phongkhach.png',
    'vill-phongan.png',
    'vill-work.png',
    'vill-conlai.png',
  ]),
  ...createProjectImages(2, '/portfolio/project-2', [
    'penthouse-1.jpg',
    'penthouse-2.jpg',
    'penthouse-3.jpg',
    'penthouse-4.jpg',
  ]),
  ...createProjectImages(3, '/portfolio/project-3', [
    'the-legal-1.jpg',
    'the-legal-2.jpg',
    'the-legal-3.jpg',
    'the-legal-4.jpg',
  ]),
  ...createProjectImages(4, '/portfolio/project-4', [
    'homestay-1.jpg',
    'homestay-2.jpg',
    'homestay-3.jpg',
    'homestay-4.jpg',
  ]),
];

/* ================= PRODUCT ================= */

export const PRODUCTS = [
  {
    id: 1,
    name: 'Sofa Nordic Velvet',
    sku: 'SNV-001',
    categoryId: 1,
    price: 15500000,
    discount: 0,
    stock: 20,
    material: 'Gỗ sồi, Vải nhung Ý',
    dimension: '220cm x 90cm x 85cm',
    weight: 45,
    description: 'Sofa phong cách Bắc Âu...',
    status: ProductStatus.active,
    rating: 4.8,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: 'Đèn thả Art Deco',
    sku: 'DT-003',
    categoryId: 5,
    price: 4800000,
    discount: 5,
    stock: 15,
    material: 'Đồng thau',
    dimension: 'D60cm x H45cm',
    weight: 3.5,
    description: 'Thiết kế nghệ thuật',
    status: ProductStatus.active,
    rating: 4.7,
    createdAt: new Date(),
  },
  {
    id: 3,
    name: 'Đèn thả Art Deco',
    sku: 'DT-003',
    categoryId: 5,
    price: 4800000,
    discount: 5,
    stock: 15,
    material: 'Đồng thau, Thủy tinh thổi thủ công',
    dimension: 'D60cm x H45cm',
    weight: 3.5,
    description:
      'Thiết kế độc bản lấy cảm hứng từ nghệ thuật đương đại, tạo điểm nhấn ánh sáng tinh tế.',
    status: ProductStatus.active,
    rating: 4.7,
    createdAt: new Date(),
  },
  {
    id: 4,
    name: 'Ghế bành Lounge Signature',
    sku: 'GBL-004',
    categoryId: 1,
    price: 8900000,
    discount: 0,
    stock: 10,
    dimension: '85cm x 80cm x 95cm',
    material: 'Da bò thật, Gỗ Walnut',
    weight: 15,
    description:
      'Đường cong công thái học hoàn hảo, bọc da thật nguyên tấm sang trọng.',
    status: ProductStatus.active,
    rating: 5.0,
    createdAt: new Date(),
  },
  {
    id: 5,
    name: 'Kệ sách Minimalist Oak',
    sku: 'KSO-005',
    categoryId: 4,
    price: 6200000,
    discount: 0,
    description:
      'Thiết kế mô-đun linh hoạt từ gỗ sồi tự nhiên, bền bỉ theo thời gian.',
    stock: 12,
    dimension: '120cm x 35cm x 180cm',
    material: 'Gỗ sồi nhập khẩu',
    weight: 28,
    status: ProductStatus.active,
    rating: 4.6,
    createdAt: new Date(),
  },
  {
    id: 6,
    name: 'Giường Zen Master',
    sku: 'GZM-006',
    categoryId: 2,
    price: 18900000,
    discount: 0,
    description:
      'Mang hơi thở Nhật Bản vào phòng ngủ với thiết kế chân thấp và đường nét gãy gọn.',
    stock: 8,
    dimension: '180cm x 200cm',
    material: 'Gỗ Tần Bì, Vải Linen',
    weight: 65,
    status: ProductStatus.active,
    rating: 4.9,
    createdAt: new Date(),
  },
];

export const PRODUCT_IMAGES = [
  {
    productId: 1,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
  },
  {
    productId: 2,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
  },
  {
    productId: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800',
  },
  {
    productId: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800',
  },
  {
    productId: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=800',
  },
  {
    productId: 6,
    imageUrl:
      'https://m.media-amazon.com/images/I/81a-oJGw2-L._AC_UF894,1000_QL80_.jpg?auto=format&fit=crop&q=80&w=800',
  },
];
