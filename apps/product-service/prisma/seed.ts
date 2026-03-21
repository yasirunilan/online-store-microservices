import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const CATEGORY_IDS = {
  electronics: '10000000-0000-0000-0000-000000000001',
  clothing: '10000000-0000-0000-0000-000000000002',
  books: '10000000-0000-0000-0000-000000000003',
  homeKitchen: '10000000-0000-0000-0000-000000000004',
};

const PRODUCT_IDS = {
  laptop: '20000000-0000-0000-0000-000000000001',
  headphones: '20000000-0000-0000-0000-000000000002',
  smartphone: '20000000-0000-0000-0000-000000000003',
  tshirt: '20000000-0000-0000-0000-000000000004',
  jeans: '20000000-0000-0000-0000-000000000005',
  jacket: '20000000-0000-0000-0000-000000000006',
  novel: '20000000-0000-0000-0000-000000000007',
  cookbook: '20000000-0000-0000-0000-000000000008',
  scienceFiction: '20000000-0000-0000-0000-000000000009',
  coffeeMaker: '20000000-0000-0000-0000-000000000010',
  blender: '20000000-0000-0000-0000-000000000011',
  toaster: '20000000-0000-0000-0000-000000000012',
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema') ?? undefined;
  url.searchParams.delete('schema');
  const adapter = new PrismaPg(
    { connectionString: url.toString() },
    schema ? { schema } : undefined,
  );
  const prisma = new PrismaClient({ adapter });

  // Seed categories and capture actual IDs (may already exist with different IDs)
  const categoryData = [
    { id: CATEGORY_IDS.electronics, name: 'Electronics' },
    { id: CATEGORY_IDS.clothing, name: 'Clothing' },
    { id: CATEGORY_IDS.books, name: 'Books' },
    { id: CATEGORY_IDS.homeKitchen, name: 'Home & Kitchen' },
  ];

  const catIds: Record<string, string> = {};
  for (const cat of categoryData) {
    const result = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    catIds[cat.name] = result.id;
  }

  // Seed products with inventory
  const products = [
    {
      id: PRODUCT_IDS.laptop,
      name: 'ProBook Laptop 15"',
      description: 'High-performance laptop with 16GB RAM and 512GB SSD',
      price: 1299.99,
      sku: 'ELEC-LAPTOP-001',
      categoryId: catIds['Electronics'],
      inventory: { quantity: 50, reservedQuantity: 3 },
    },
    {
      id: PRODUCT_IDS.headphones,
      name: 'SoundMax Wireless Headphones',
      description: 'Noise-cancelling over-ear headphones with 30h battery',
      price: 199.99,
      sku: 'ELEC-HDPHN-002',
      categoryId: catIds['Electronics'],
      inventory: { quantity: 100, reservedQuantity: 5 },
    },
    {
      id: PRODUCT_IDS.smartphone,
      name: 'Galaxy Ultra Phone',
      description: '6.7" AMOLED display, 128GB storage, 5G capable',
      price: 899.99,
      sku: 'ELEC-PHONE-003',
      categoryId: catIds['Electronics'],
      inventory: { quantity: 75, reservedQuantity: 2 },
    },
    {
      id: PRODUCT_IDS.tshirt,
      name: 'Classic Cotton T-Shirt',
      description: '100% organic cotton, available in multiple colors',
      price: 29.99,
      sku: 'CLTH-TSHRT-001',
      categoryId: catIds['Clothing'],
      inventory: { quantity: 200, reservedQuantity: 0 },
    },
    {
      id: PRODUCT_IDS.jeans,
      name: 'Slim Fit Denim Jeans',
      description: 'Comfortable stretch denim with modern slim fit',
      price: 69.99,
      sku: 'CLTH-JEANS-002',
      categoryId: catIds['Clothing'],
      inventory: { quantity: 150, reservedQuantity: 1 },
    },
    {
      id: PRODUCT_IDS.jacket,
      name: 'Waterproof Windbreaker',
      description: 'Lightweight waterproof jacket for outdoor activities',
      price: 119.99,
      sku: 'CLTH-JCKT-003',
      categoryId: catIds['Clothing'],
      inventory: { quantity: 80, reservedQuantity: 0 },
    },
    {
      id: PRODUCT_IDS.novel,
      name: 'The Midnight Library',
      description: 'A novel about the choices that go into a life well lived',
      price: 14.99,
      sku: 'BOOK-NOVL-001',
      categoryId: catIds['Books'],
      inventory: { quantity: 60, reservedQuantity: 0 },
    },
    {
      id: PRODUCT_IDS.cookbook,
      name: 'The Complete Cookbook',
      description: 'Over 500 recipes for every occasion, from beginner to expert',
      price: 34.99,
      sku: 'BOOK-COOK-002',
      categoryId: catIds['Books'],
      inventory: { quantity: 40, reservedQuantity: 2 },
    },
    {
      id: PRODUCT_IDS.scienceFiction,
      name: 'Dune: Special Edition',
      description: 'Frank Herbert\'s masterpiece of science fiction',
      price: 18.99,
      sku: 'BOOK-SCFI-003',
      categoryId: catIds['Books'],
      inventory: { quantity: 35, reservedQuantity: 0 },
    },
    {
      id: PRODUCT_IDS.coffeeMaker,
      name: 'BrewMaster Drip Coffee Maker',
      description: '12-cup programmable coffee maker with thermal carafe',
      price: 79.99,
      sku: 'HOME-COFF-001',
      categoryId: catIds['Home & Kitchen'],
      inventory: { quantity: 45, reservedQuantity: 1 },
    },
    {
      id: PRODUCT_IDS.blender,
      name: 'PowerBlend Pro Blender',
      description: '1200W high-speed blender with 64oz pitcher',
      price: 129.99,
      sku: 'HOME-BLND-002',
      categoryId: catIds['Home & Kitchen'],
      inventory: { quantity: 30, reservedQuantity: 0 },
    },
    {
      id: PRODUCT_IDS.toaster,
      name: 'CrispToast 4-Slice Toaster',
      description: 'Stainless steel toaster with wide slots and defrost function',
      price: 49.99,
      sku: 'HOME-TSTR-003',
      categoryId: catIds['Home & Kitchen'],
      inventory: { quantity: 55, reservedQuantity: 0 },
    },
  ];

  for (const { inventory, ...product } of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
    await prisma.inventory.upsert({
      where: { productId: created.id },
      update: {},
      create: {
        productId: created.id,
        quantity: inventory.quantity,
        reservedQuantity: inventory.reservedQuantity,
      },
    });
  }

  console.log('Product seed completed: 4 categories, 12 products with inventory');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
