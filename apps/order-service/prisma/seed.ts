import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const USER_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  john: '00000000-0000-0000-0000-000000000002',
  jane: '00000000-0000-0000-0000-000000000003',
  bob: '00000000-0000-0000-0000-000000000004',
  alice: '00000000-0000-0000-0000-000000000005',
};

const PRODUCT_IDS = {
  laptop: '20000000-0000-0000-0000-000000000001',
  headphones: '20000000-0000-0000-0000-000000000002',
  smartphone: '20000000-0000-0000-0000-000000000003',
  tshirt: '20000000-0000-0000-0000-000000000004',
  jeans: '20000000-0000-0000-0000-000000000005',
  novel: '20000000-0000-0000-0000-000000000007',
  cookbook: '20000000-0000-0000-0000-000000000008',
  coffeeMaker: '20000000-0000-0000-0000-000000000010',
  blender: '20000000-0000-0000-0000-000000000011',
};

const ORDER_IDS = {
  order1: '30000000-0000-0000-0000-000000000001',
  order2: '30000000-0000-0000-0000-000000000002',
  order3: '30000000-0000-0000-0000-000000000003',
  order4: '30000000-0000-0000-0000-000000000004',
  order5: '30000000-0000-0000-0000-000000000005',
  order6: '30000000-0000-0000-0000-000000000006',
  order7: '30000000-0000-0000-0000-000000000007',
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

  const orders = [
    {
      id: ORDER_IDS.order1,
      userId: USER_IDS.john,
      email: 'john@example.com',
      status: 'PENDING' as const,
      totalAmount: 1499.98,
      items: [
        { productId: PRODUCT_IDS.laptop, productName: 'ProBook Laptop 15"', quantity: 1, price: 1299.99 },
        { productId: PRODUCT_IDS.headphones, productName: 'SoundMax Wireless Headphones', quantity: 1, price: 199.99 },
      ],
    },
    {
      id: ORDER_IDS.order2,
      userId: USER_IDS.jane,
      email: 'jane@example.com',
      status: 'CONFIRMED' as const,
      totalAmount: 99.98,
      items: [
        { productId: PRODUCT_IDS.tshirt, productName: 'Classic Cotton T-Shirt', quantity: 2, price: 29.99 },
        { productId: PRODUCT_IDS.novel, productName: 'The Midnight Library', quantity: 1, price: 14.99 },
      ],
    },
    {
      id: ORDER_IDS.order3,
      userId: USER_IDS.bob,
      email: 'bob@example.com',
      status: 'SHIPPED' as const,
      totalAmount: 899.99,
      items: [
        { productId: PRODUCT_IDS.smartphone, productName: 'Galaxy Ultra Phone', quantity: 1, price: 899.99 },
      ],
    },
    {
      id: ORDER_IDS.order4,
      userId: USER_IDS.alice,
      email: 'alice@example.com',
      status: 'DELIVERED' as const,
      totalAmount: 209.98,
      items: [
        { productId: PRODUCT_IDS.coffeeMaker, productName: 'BrewMaster Drip Coffee Maker', quantity: 1, price: 79.99 },
        { productId: PRODUCT_IDS.blender, productName: 'PowerBlend Pro Blender', quantity: 1, price: 129.99 },
      ],
    },
    {
      id: ORDER_IDS.order5,
      userId: USER_IDS.john,
      email: 'john@example.com',
      status: 'DELIVERED' as const,
      totalAmount: 69.99,
      items: [
        { productId: PRODUCT_IDS.jeans, productName: 'Slim Fit Denim Jeans', quantity: 1, price: 69.99 },
      ],
    },
    {
      id: ORDER_IDS.order6,
      userId: USER_IDS.jane,
      email: 'jane@example.com',
      status: 'PENDING' as const,
      totalAmount: 53.98,
      items: [
        { productId: PRODUCT_IDS.cookbook, productName: 'The Complete Cookbook', quantity: 1, price: 34.99 },
        { productId: PRODUCT_IDS.novel, productName: 'The Midnight Library', quantity: 1, price: 14.99 },
      ],
    },
    {
      id: ORDER_IDS.order7,
      userId: USER_IDS.admin,
      email: 'admin@online-store.com',
      status: 'CONFIRMED' as const,
      totalAmount: 329.98,
      items: [
        { productId: PRODUCT_IDS.headphones, productName: 'SoundMax Wireless Headphones', quantity: 1, price: 199.99 },
        { productId: PRODUCT_IDS.blender, productName: 'PowerBlend Pro Blender', quantity: 1, price: 129.99 },
      ],
    },
  ];

  for (const { items, ...order } of orders) {
    await prisma.order.upsert({
      where: { id: order.id },
      update: {},
      create: {
        ...order,
        items: {
          create: items,
        },
      },
    });
  }

  console.log('Order seed completed: 7 orders with items');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
