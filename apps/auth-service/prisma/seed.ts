import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const USER_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  john: '00000000-0000-0000-0000-000000000002',
  jane: '00000000-0000-0000-0000-000000000003',
  bob: '00000000-0000-0000-0000-000000000004',
  alice: '00000000-0000-0000-0000-000000000005',
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

  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = [
    { id: USER_IDS.admin, email: 'admin@online-store.com', password: hashedPassword },
    { id: USER_IDS.john, email: 'john@example.com', password: hashedPassword },
    { id: USER_IDS.jane, email: 'jane@example.com', password: hashedPassword },
    { id: USER_IDS.bob, email: 'bob@example.com', password: hashedPassword },
    { id: USER_IDS.alice, email: 'alice@example.com', password: hashedPassword },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('Auth seed completed: 5 users created');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
