// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
// import { PRODUCTS, PRODUCT_IMAGES, PROJECTS, PROJECT_IMAGES } from './data';

const prisma = new PrismaClient();

// async function clearDatabase() {
//   console.log('🧹 Clearing database...');
//   await prisma.projectImage.deleteMany();
//   await prisma.project.deleteMany();
//   await prisma.productImage.deleteMany();
//   await prisma.product.deleteMany();
//   await prisma.category.deleteMany();
// }
/* ================= USERS ================= */
async function seedUsers() {
  console.log('🌱 Seeding users...');
  await prisma.user.createMany({
    data: [
      {
        id: 1,
        name: 'User 1',
        email: 'user@example.com',
        phone: '0123456789',
        role: 'customer',
        passwordHash: '123456',
        avatar:
          'https://img.freepik.com/vector-mien-phi/hinh-minh-hoa-chang-trai-tre-mim-cuoi_1308-174669.jpg?semt=ais_hybrid&w=740&q=80',
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        phone: '0987654321',
        role: 'customer',
        passwordHash: '123456',
        avatar:
          'https://img.freepik.com/vector-mien-phi/hinh-minh-hoa-cau-be-toc-do-tuoi-cuoi_1308-176664.jpg?semt=ais_hybrid&w=740&q=80',
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'User 3',
        email: 'user3@example.com',
        phone: '0987654322',
        role: 'admin',
        passwordHash: '123456',
        avatar:
          'https://img.freepik.com/vetores-gratis/homem-sorridente-com-oculos_1308-174409.jpg?semt=ais_hybrid&w=740&q=80',
        createdAt: new Date(),
      },
    ],
  });
  console.log('Users seeded');
}

/* ================= CATEGORIES ================= */
// async function seedCategories() {
//   console.log('🌱 Seeding categories...');
//   await prisma.category.createMany({
//     data: [
//       { id: 1, name: 'Phòng khách' },
//       { id: 2, name: 'Phòng ngủ' },
//       { id: 3, name: 'Phòng ăn' },
//       { id: 4, name: 'Văn phòng' },
//       { id: 5, name: 'Trang trí' },
//     ],
//   });
//   console.log('Categories seeded');
// }

/* ================= PROJECTS ================= */
// async function seedProjects() {
//   console.log('🌱 Seeding projects...');

//   await prisma.project.createMany({
//     data: PROJECTS,
//   });

//   await prisma.projectImage.createMany({
//     data: PROJECT_IMAGES,
//   });

//   console.log('Projects seeded!');
// }

/* ================= PRODUCTS ================= */

// async function seedProducts() {
//   console.log('🌱 Seeding products...');

//   await prisma.product.createMany({
//     data: PRODUCTS,
//   });

//   await prisma.productImage.createMany({
//     data: PRODUCT_IMAGES,
//   });

//   console.log('Products seeded');
// }
/* ================= REVIEWS ================= */

// async function seedReviews() {
//   console.log('🌱 Seeding reviews...');
//   await prisma.review.createMany({
//     data: [
//       {
//         productId: 2,
//         userId: 1,
//         rating: 4,
//         comment: 'Đèn đẹp, ánh sáng ấm',
//         avatar: null,
//         createdAt: new Date('2024-01-18'),
//       },
//       {
//         productId: 3,
//         userId: 2,
//         rating: 4,
//         comment: 'Bàn ăn chắc chắn, nhưng giao hàng hơi chậm.',
//         avatar: null,
//         createdAt: new Date('2023-12-01'),
//       },
//       {
//         userId: 3,
//         productId: 6,
//         rating: 5,
//         comment: 'Giường chắc chắn, thiết kế tối giản đúng ý mình.',
//         avatar: null,
//         createdAt: new Date('2024-02-05'),
//       },
//     ],
//   });
//   console.log('Reviews seeded');
// }

/* ================= DISCOUNT CODES ================= */
// async function seedDiscountCodes() {
//   console.log('🌱 Seeding discount codes...');
//   await prisma.discountCode.createMany({
//     data: [
//       {
//         code: 'LUXNEW',
//         value: 10,
//         type: 'percent',
//         expiredAt: new Date('2026-05-10'),
//       },
//       {
//         code: 'NHAMOI',
//         value: 500000,
//         type: 'fixed',
//         expiredAt: new Date('2026-01-20'),
//       },
//     ],
//   });
//   console.log('Discount codes seeded');
// }

/* ================= MAIN SEED FUNCTION ================= */
async function main() {
  try {
    // await clearDatabase();
    await seedUsers();
    // await seedCategories();
    // await seedProjects();
    // await seedProducts();
    // await seedReviews();
    // await seedDiscountCodes();

    console.log('🎉 Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
