import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

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

  const profiles = [
    {
      id: USER_IDS.admin,
      email: 'admin@online-store.com',
      firstName: 'Admin',
      lastName: 'User',
      avatarUrl: null,
    },
    {
      id: USER_IDS.john,
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: 'https://i.pravatar.cc/150?u=john',
    },
    {
      id: USER_IDS.jane,
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      avatarUrl: 'https://i.pravatar.cc/150?u=jane',
    },
    {
      id: USER_IDS.bob,
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Wilson',
      avatarUrl: null,
    },
    {
      id: USER_IDS.alice,
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    },
  ];

  for (const profile of profiles) {
    await prisma.userProfile.upsert({
      where: { email: profile.email },
      update: {},
      create: profile,
    });
  }

  console.log('User seed completed: 5 profiles created');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
