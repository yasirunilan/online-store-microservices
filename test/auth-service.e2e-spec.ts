import { authClient } from './helpers/http.helper';
import { registerUser, loginUser, uniqueEmail } from './helpers/auth.helper';

describe('Auth Service (e2e)', () => {
  // ── Register ────────────────────────────────────────────────────────

  describe('POST /v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const email = uniqueEmail();
      const res = await authClient.post('/v1/auth/register', {
        email,
        password: 'Test1234!',
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('accessToken');
      expect(res.data).toHaveProperty('refreshToken');
      expect(typeof res.data.accessToken).toBe('string');
      expect(typeof res.data.refreshToken).toBe('string');
    });

    it('should return 409 for duplicate email', async () => {
      const { email } = await registerUser();

      const res = await authClient.post('/v1/auth/register', {
        email,
        password: 'Test1234!',
      });

      expect(res.status).toBe(409);
    });

    it('should return 400 for invalid email', async () => {
      const res = await authClient.post('/v1/auth/register', {
        email: 'not-an-email',
        password: 'Test1234!',
      });

      expect(res.status).toBe(400);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────

  describe('POST /v1/auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const { email, password } = await registerUser();

      const res = await authClient.post('/v1/auth/login', {
        email,
        password,
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');
      expect(res.data).toHaveProperty('refreshToken');
      expect(typeof res.data.accessToken).toBe('string');
      expect(typeof res.data.refreshToken).toBe('string');
    });

    it('should return 401 for wrong password', async () => {
      const { email } = await registerUser();

      const res = await authClient.post('/v1/auth/login', {
        email,
        password: 'WrongPassword99!',
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 for nonexistent email', async () => {
      const res = await authClient.post('/v1/auth/login', {
        email: uniqueEmail(),
        password: 'Test1234!',
      });

      expect(res.status).toBe(401);
    });
  });

  // ── Refresh ─────────────────────────────────────────────────────────

  describe('POST /v1/auth/refresh', () => {
    it('should return new tokens with a valid refresh token', async () => {
      const { tokens } = await registerUser();

      const res = await authClient.post('/v1/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');
      expect(res.data).toHaveProperty('refreshToken');
      expect(typeof res.data.accessToken).toBe('string');
      expect(typeof res.data.refreshToken).toBe('string');
    });

    it('should return 401 for an invalid refresh token', async () => {
      const res = await authClient.post('/v1/auth/refresh', {
        refreshToken: 'invalid-token-string',
      });

      expect(res.status).toBe(401);
    });
  });

  // ── Logout ──────────────────────────────────────────────────────────

  describe('POST /v1/auth/logout', () => {
    it('should logout and return 204', async () => {
      const { tokens } = await registerUser();

      const res = await authClient.post('/v1/auth/logout', {
        refreshToken: tokens.refreshToken,
      });

      expect(res.status).toBe(204);
    });
  });

  // ── JWKS ────────────────────────────────────────────────────────────

  describe('GET /.well-known/jwks.json', () => {
    it('should return JWKS with RS256 key', async () => {
      const res = await authClient.get('/.well-known/jwks.json');

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('keys');
      expect(Array.isArray(res.data.keys)).toBe(true);
      expect(res.data.keys.length).toBeGreaterThanOrEqual(1);

      const key = res.data.keys[0];
      expect(key.kty).toBe('RSA');
      expect(key.alg).toBe('RS256');
      expect(key).toHaveProperty('n');
      expect(key).toHaveProperty('e');
    });
  });

  // ── Health ──────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200', async () => {
      const res = await authClient.get('/health');

      expect(res.status).toBe(200);
    });
  });
});
