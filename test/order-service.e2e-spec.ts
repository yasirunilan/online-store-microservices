import { orderClient, authHeaders } from './helpers/http.helper';
import { registerUser } from './helpers/auth.helper';

describe('Order Service (e2e)', () => {
  let accessToken: string;
  let userEmail: string;
  let orderId: string;

  beforeAll(async () => {
    const { email, tokens } = await registerUser();
    accessToken = tokens.accessToken;
    userEmail = email;
  });

  // ── Create Order ────────────────────────────────────────────────────

  describe('POST /v1/orders', () => {
    it('should create an order and return 201', async () => {
      const res = await orderClient.post(
        '/v1/orders',
        {
          email: userEmail,
          items: [
            {
              productId: 'prod-1',
              productName: 'Widget',
              quantity: 2,
              price: 19.99,
            },
          ],
        },
        { headers: authHeaders(accessToken) },
      );

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data.status).toBe('PENDING');
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(res.data.items).toHaveLength(1);
      expect(res.data).toHaveProperty('totalAmount');

      orderId = res.data.id;
    });

    it('should return 401 without auth token', async () => {
      const res = await orderClient.post('/v1/orders', {
        email: userEmail,
        items: [
          {
            productId: 'prod-1',
            productName: 'Widget',
            quantity: 1,
            price: 19.99,
          },
        ],
      });

      expect(res.status).toBe(401);
    });
  });

  // ── Get Order by ID ─────────────────────────────────────────────────

  describe('GET /v1/orders/:id', () => {
    it('should return the order with items', async () => {
      const res = await orderClient.get(`/v1/orders/${orderId}`, {
        headers: authHeaders(accessToken),
      });

      expect(res.status).toBe(200);
      expect(res.data.id).toBe(orderId);
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(res.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for nonexistent order', async () => {
      const res = await orderClient.get(
        '/v1/orders/00000000-0000-0000-0000-000000000000',
        { headers: authHeaders(accessToken) },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── Get My Orders ──────────────────────────────────────────────────

  describe('GET /v1/orders/me', () => {
    it('should return array containing the created order', async () => {
      const res = await orderClient.get('/v1/orders/me', {
        headers: authHeaders(accessToken),
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);

      const ids = res.data.map((o: { id: string }) => o.id);
      expect(ids).toContain(orderId);
    });
  });

  // ── Update Order Status ────────────────────────────────────────────

  describe('PATCH /v1/orders/:id/status', () => {
    it('should update order status to CONFIRMED', async () => {
      const res = await orderClient.patch(
        `/v1/orders/${orderId}/status`,
        { status: 'CONFIRMED' },
        { headers: authHeaders(accessToken) },
      );

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('CONFIRMED');
    });
  });

  // ── Verify Status After Update ─────────────────────────────────────

  describe('GET /v1/orders/:id (after status update)', () => {
    it('should reflect the updated CONFIRMED status', async () => {
      const res = await orderClient.get(`/v1/orders/${orderId}`, {
        headers: authHeaders(accessToken),
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('CONFIRMED');
    });
  });

  // ── Health ─────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200', async () => {
      const res = await orderClient.get('/health');

      expect(res.status).toBe(200);
    });
  });
});
