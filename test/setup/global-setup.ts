import axios from 'axios';

const SERVICES = [
  { name: 'auth-service', url: 'http://localhost:3001/health' },
  { name: 'user-service', url: 'http://localhost:3002/health' },
  { name: 'product-service', url: 'http://localhost:3003/health' },
  { name: 'order-service', url: 'http://localhost:3004/health' },
  { name: 'notification-service', url: 'http://localhost:3005/health' },
];

export default async function globalSetup() {
  console.log('\n🔍 Checking service health...\n');

  const results = await Promise.allSettled(
    SERVICES.map(async (svc) => {
      try {
        const res = await axios.get(svc.url, { timeout: 5_000 });
        if (res.status === 200) {
          console.log(`  ✓ ${svc.name} is healthy`);
          return;
        }
        throw new Error(`status ${res.status}`);
      } catch (err: any) {
        throw new Error(`${svc.name} is not reachable at ${svc.url}: ${err.message}`);
      }
    }),
  );

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.error('\n❌ Some services are not running:\n');
    failures.forEach((f) => {
      if (f.status === 'rejected') console.error(`  • ${f.reason.message}`);
    });
    console.error('\nRun `pnpm dev` and `docker compose up -d` first.\n');
    process.exit(1);
  }

  console.log('\n✅ All services are healthy. Starting e2e tests...\n');
}
