import {
  authHeaders,
  userClient,
  orderClient,
  mailhogClient,
} from './helpers/http.helper';
import { registerUser, uniqueEmail } from './helpers/auth.helper';
import { waitFor } from './helpers/wait.helper';

interface MailHogMessage {
  Content: {
    Headers: {
      To: string[];
      Subject: string[];
    };
    Body: string;
  };
}

interface MailHogResponse {
  items: MailHogMessage[];
}

async function findMailFor(
  email: string,
  subjectContains?: string,
): Promise<MailHogMessage | null> {
  const res = await mailhogClient.get<MailHogResponse>('/api/v2/messages');
  if (res.status !== 200 || !res.data.items) return null;

  return (
    res.data.items.find((msg) => {
      const toMatch = msg.Content.Headers.To?.some((to) => to.includes(email));
      if (!toMatch) return false;
      if (subjectContains) {
        return msg.Content.Headers.Subject?.some((s) =>
          s.toLowerCase().includes(subjectContains.toLowerCase()),
        );
      }
      return true;
    }) ?? null
  );
}

describe('Cross-Service Flows (e2e)', () => {
  // ── Registration Flow ───────────────────────────────────────────────

  describe('Registration async flows', () => {
    it('should create a user profile in user-service after registration', async () => {
      const { email, tokens } = await registerUser();

      const profile = await waitFor(
        async () => {
          const res = await userClient.get('/v1/users/me', {
            headers: authHeaders(tokens.accessToken),
          });
          return res.status === 200 ? res.data : null;
        },
        { timeout: 10_000 },
      );

      expect(profile).toBeDefined();
      expect(profile.email).toBe(email);
    });

    it('should send a welcome email after registration', async () => {
      const { email } = await registerUser();

      const welcomeMail = await waitFor(
        () => findMailFor(email, 'welcome'),
        { timeout: 10_000 },
      );

      expect(welcomeMail).toBeDefined();
      expect(welcomeMail!.Content.Headers.To.some((t) => t.includes(email))).toBe(true);
    });
  });

  // ── Order Flow ──────────────────────────────────────────────────────

  describe('Order async flows', () => {
    let accessToken: string;
    let userEmail: string;

    beforeAll(async () => {
      const { email, tokens } = await registerUser();
      accessToken = tokens.accessToken;
      userEmail = email;

      // Wait for user profile to be created before placing orders
      await waitFor(async () => {
        const res = await userClient.get('/v1/users/me', {
          headers: authHeaders(accessToken),
        });
        return res.status === 200 ? res.data : null;
      });
    });

    it('should send a confirmation email after order placement', async () => {
      const orderRes = await orderClient.post(
        '/v1/orders',
        {
          email: userEmail,
          items: [
            {
              productId: 'prod-e2e-1',
              productName: 'E2E Widget',
              quantity: 1,
              price: 9.99,
            },
          ],
        },
        { headers: authHeaders(accessToken) },
      );

      expect(orderRes.status).toBe(201);

      const confirmationMail = await waitFor(
        () => findMailFor(userEmail, 'order'),
        { timeout: 10_000 },
      );

      expect(confirmationMail).toBeDefined();
      expect(
        confirmationMail!.Content.Headers.To.some((t) => t.includes(userEmail)),
      ).toBe(true);
    });

    it('should send a notification email after order status update', async () => {
      // Create a fresh order
      const orderRes = await orderClient.post(
        '/v1/orders',
        {
          email: userEmail,
          items: [
            {
              productId: 'prod-e2e-2',
              productName: 'E2E Gadget',
              quantity: 1,
              price: 14.99,
            },
          ],
        },
        { headers: authHeaders(accessToken) },
      );

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.data.id;

      // Update order status
      const statusRes = await orderClient.patch(
        `/v1/orders/${orderId}/status`,
        { status: 'CONFIRMED' },
        { headers: authHeaders(accessToken) },
      );

      expect(statusRes.status).toBe(200);

      const statusMail = await waitFor(
        () => findMailFor(userEmail, 'status'),
        { timeout: 10_000 },
      );

      expect(statusMail).toBeDefined();
      expect(
        statusMail!.Content.Headers.To.some((t) => t.includes(userEmail)),
      ).toBe(true);
    });
  });
});
