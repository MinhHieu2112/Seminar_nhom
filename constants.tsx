
import { Product, DiscountCode } from './types';

export const DISCOUNT_CODES: DiscountCode[] = [
  { code: 'LUXNEW', value: 10, type: 'percent' },
  { code: 'NHAMOI', value: 500000, type: 'fixed' },
  { code: 'GIANGSINH', value: 15, type: 'percent' }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Sofa Nordic Velvet',
    sku: 'SNV-001',
    category_id: '1',
    category: 'Phòng khách',
    price: 15500000,
    discount: 0,
    description: 'Sofa phong cách Bắc Âu với chất liệu nhung cao cấp, mang lại sự sang trọng và êm ái tuyệt đối cho phòng khách của bạn.',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'],
    dimension: '220cm x 90cm x 85cm',
    material: 'Gỗ sồi, Vải nhung Ý',
    weight: 45,
    status: 'active',
    rating: 4.8,
    reviews: [
      { id: 'r1', user_name: 'Minh Anh', rating: 5, comment: 'Sofa cực kỳ êm, màu sắc sang trọng hơn cả trong hình. Giao hàng rất đúng hẹn.', date: '15/02/2024' },
      { id: 'r2', user_name: 'Hoàng Long', rating: 4, comment: 'Chất lượng tốt, tuy nhiên mình phải chờ lâu hơn dự kiến 1 ngày.', date: '10/02/2024' }
    ]
  },
  {
    id: '2',
    name: 'Bàn ăn Minimalist Marble',
    sku: 'BAM-002',
    category_id: '3',
    category: 'Phòng ăn',
    price: 22000000,
    discount: 0,
    description: 'Mặt bàn đá Marble tự nhiên kết hợp chân kim loại sơn tĩnh điện, phù hợp cho không gian tối giản hiện đại.',
    images: ['https://images.unsplash.com/photo-1577145101037-142270921471?auto=format&fit=crop&q=80&w=800'],
    dimension: '180cm x 90cm x 75cm',
    material: 'Đá Marble, Thép không gỉ',
    weight: 120,
    status: 'active',
    rating: 4.9,
    reviews: [
      { id: 'r3', user_name: 'Thu Trang', rating: 5, comment: 'Đá marble vân rất đẹp, chân bàn cực kỳ chắc chắn. Rất hài lòng.', date: '20/01/2024' }
    ]
  },
  {
    id: '3',
    name: 'Đèn thả Art Deco',
    sku: 'DT-003',
    category_id: '5',
    category: 'Trang trí',
    price: 4800000,
    discount: 5,
    description: 'Thiết kế độc bản lấy cảm hứng từ nghệ thuật đương đại, tạo điểm nhấn ánh sáng tinh tế.',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800'],
    dimension: 'D60cm x H45cm',
    material: 'Đồng thau, Thủy tinh thổi thủ công',
    weight: 3.5,
    status: 'active',
    rating: 4.7,
    reviews: []
  },
  {
    id: '4',
    name: 'Ghế bành Lounge Signature',
    sku: 'GBL-004',
    category_id: '1',
    category: 'Phòng khách',
    price: 8900000,
    discount: 0,
    description: 'Đường cong công thái học hoàn hảo, bọc da thật nguyên tấm sang trọng.',
    images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800'],
    dimension: '85cm x 80cm x 95cm',
    material: 'Da bò thật, Gỗ Walnut',
    weight: 15,
    status: 'active',
    rating: 5.0,
    reviews: [
      { id: 'r4', user_name: 'Thanh Hải', rating: 5, comment: 'Ngồi cực kỳ thoải mái, da thật sờ rất sướng tay. Đúng là tiền nào của nấy.', date: '12/12/2023' }
    ]
  },
  {
    id: '5',
    name: 'Kệ sách Minimalist Oak',
    sku: 'KSO-005',
    category_id: '4',
    category: 'Văn phòng',
    price: 6200000,
    discount: 0,
    description: 'Thiết kế mô-đun linh hoạt từ gỗ sồi tự nhiên, bền bỉ theo thời gian.',
    images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=800'],
    dimension: '120cm x 35cm x 180cm',
    material: 'Gỗ sồi nhập khẩu',
    weight: 28,
    status: 'active',
    rating: 4.6,
    reviews: []
  },
  {
    id: '6',
    name: 'Giường Zen Master',
    sku: 'GZM-006',
    category_id: '2',
    category: 'Phòng ngủ',
    price: 18900000,
    discount: 0,
    description: 'Mang hơi thở Nhật Bản vào phòng ngủ với thiết kế chân thấp và đường nét gãy gọn.',
    images: ['https://images.unsplash.com/photo-1505693419148-9330f54cd2e9?auto=format&fit=crop&q=80&w=800'],
    dimension: '180cm x 200cm',
    material: 'Gỗ Tần Bì, Vải Linen',
    weight: 65,
    status: 'active',
    rating: 4.9,
    reviews: [
      { id: 'r5', user_name: 'Anh Đức', rating: 5, comment: 'Giường chắc chắn, thiết kế tối giản đúng ý mình.', date: '05/02/2024' }
    ]
  }
];

export const CATEGORIES = ['Tất cả', 'Phòng khách', 'Phòng ngủ', 'Phòng ăn', 'Văn phòng', 'Trang trí'];
