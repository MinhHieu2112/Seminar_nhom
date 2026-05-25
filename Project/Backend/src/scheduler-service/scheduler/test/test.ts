import { PrismaClient } from '@prisma/scheduler-client';

const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.findFirst();
  if (!cat) {
    console.log('No category found to test.');
    return;
  }

  console.log('Found category:', cat);
  try {
    const updated = await prisma.category.update({
      where: { id: cat.id, userId: cat.userId },
      data: { name: cat.name + ' updated' },
    });
    console.log('Update success:', updated);
  } catch (e: any) {
    console.error('Update error:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
