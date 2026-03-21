import { userClient, authHeaders } from './helpers/http.helper';
import { registerUser } from './helpers/auth.helper';
import { waitFor } from './helpers/wait.helper';

describe('User Service (e2e)', () => {
  describe('GET /v1/users/me', () => {
    it('should return the profile after registration', async () => {
      const { email, tokens } = await registerUser();

      const profile = await waitFor(async () => {
        const res = await userClient.get('/v1/users/me', {
          headers: authHeaders(tokens.accessToken),
        });
        return res.status === 200 ? res.data : null;
      });

      expect(profile.email).toBe(email);
    });

    it('should return 401 without a token', async () => {
      const res = await userClient.get('/v1/users/me');
      expect(res.status).toBe(401);
    });

    it('should return updated values after profile update', async () => {
      const { tokens } = await registerUser();

      await waitFor(async () => {
        const res = await userClient.get('/v1/users/me', {
          headers: authHeaders(tokens.accessToken),
        });
        return res.status === 200 ? res.data : null;
      });

      await userClient.patch(
        '/v1/users/me',
        { firstName: 'Updated', lastName: 'User' },
        { headers: authHeaders(tokens.accessToken) },
      );

      const res = await userClient.get('/v1/users/me', {
        headers: authHeaders(tokens.accessToken),
      });

      expect(res.status).toBe(200);
      expect(res.data.firstName).toBe('Updated');
      expect(res.data.lastName).toBe('User');
    });
  });

  describe('PATCH /v1/users/me', () => {
    it('should update profile with full name', async () => {
      const { tokens } = await registerUser();

      await waitFor(async () => {
        const res = await userClient.get('/v1/users/me', {
          headers: authHeaders(tokens.accessToken),
        });
        return res.status === 200 ? res.data : null;
      });

      const res = await userClient.patch(
        '/v1/users/me',
        { firstName: 'John', lastName: 'Doe' },
        { headers: authHeaders(tokens.accessToken) },
      );

      expect(res.status).toBe(200);
      expect(res.data.firstName).toBe('John');
      expect(res.data.lastName).toBe('Doe');
    });

    it('should update profile with partial data', async () => {
      const { tokens } = await registerUser();

      await waitFor(async () => {
        const res = await userClient.get('/v1/users/me', {
          headers: authHeaders(tokens.accessToken),
        });
        return res.status === 200 ? res.data : null;
      });

      const res = await userClient.patch(
        '/v1/users/me',
        { firstName: 'Jane' },
        { headers: authHeaders(tokens.accessToken) },
      );

      expect(res.status).toBe(200);
      expect(res.data.firstName).toBe('Jane');
    });
  });

  describe('GET /health', () => {
    it('should return 200', async () => {
      const res = await userClient.get('/health');
      expect(res.status).toBe(200);
    });
  });
});
