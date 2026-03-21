import { authClient } from './http.helper';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

let counter = 0;

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${++counter}@test.local`;
}

export async function registerUser(
  email?: string,
  password = 'Test1234!',
): Promise<{ email: string; password: string; tokens: AuthTokens }> {
  const userEmail = email ?? uniqueEmail();

  const res = await authClient.post('/v1/auth/register', {
    email: userEmail,
    password,
  });

  if (res.status !== 201) {
    throw new Error(`Registration failed (${res.status}): ${JSON.stringify(res.data)}`);
  }

  return {
    email: userEmail,
    password,
    tokens: {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    },
  };
}

export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const res = await authClient.post('/v1/auth/login', { email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(res.data)}`);
  }

  return {
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  };
}

export async function getAuthenticatedUser(): Promise<{
  email: string;
  tokens: AuthTokens;
}> {
  const { email, tokens } = await registerUser();
  return { email, tokens };
}
