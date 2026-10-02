import { faker } from '@faker-js/faker';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { SEED_PRODUCTS } from './products.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const inventoryItems = SEED_PRODUCTS.map((product) => ({
    productId: product.id,
    quantity: faker.number.int({ min: 20, max: 300 }),
    reserved: 0,
  }));

  const result = await prisma.inventoryItem.createMany({
    data: inventoryItems,
    skipDuplicates: true,
  });

  const skipped = inventoryItems.length - result.count;
  console.log(
    `Seeded ${result.count} inventory items${skipped > 0 ? ` (${skipped} already existed, skipped)` : ''}.`,
  );

  const seeded = await prisma.inventoryItem.findMany({
    where: { productId: { in: SEED_PRODUCTS.map((p) => p.id) } },
    orderBy: { createdAt: 'asc' },
  });

  for (const item of seeded) {
    const product = SEED_PRODUCTS.find((p) => p.id === item.productId)!;
    console.log(`  [${product.category}] ${product.name} — qty: ${item.quantity}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
