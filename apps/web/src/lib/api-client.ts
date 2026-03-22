import { useAuthStore } from '@/lib/auth-store';
import { CATEGORIES_QUERY, PRODUCT_QUERY, PRODUCTS_QUERY } from '@/lib/graphql-queries';
import type {
  AuthResponse,
  CartItem,
  Category,
  Order,
  Product,
  UserProfile,
} from '@/lib/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data: AuthResponse = await res.json();
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = attemptRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && accessToken) {
    const refreshed = await handleTokenRefresh();
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken;
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } else {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError('Session expired', 401);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(body.message || 'Request failed', res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// Auth
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
}

export async function logout(token: string): Promise<void> {
  return apiFetch<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
}

// User
export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/users/me');
}

export async function updateProfile(
  data: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'avatarUrl'>>,
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Products (via GraphQL proxy)
async function graphqlFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await apiFetch<{ data: T; errors?: { message: string }[] }>(
    '/api/graphql',
    {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    },
  );

  if (res.errors?.length) {
    throw new ApiError(res.errors[0].message, 400);
  }

  return res.data;
}

export async function fetchProducts(params: {
  limit: number;
  offset: number;
  categoryId?: string;
}): Promise<Product[]> {
  const data = await graphqlFetch<{ products: Product[] }>(
    PRODUCTS_QUERY,
    params,
  );
  return data.products;
}

export async function fetchProduct(id: string): Promise<Product> {
  const data = await graphqlFetch<{ product: Product }>(PRODUCT_QUERY, { id });
  return data.product;
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await graphqlFetch<{ categories: Category[] }>(
    CATEGORIES_QUERY,
  );
  return data.categories;
}

// Orders
export async function createOrder(
  email: string,
  items: CartItem[],
): Promise<Order> {
  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      email,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
    }),
  });
}

export async function getMyOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/api/orders');
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}`);
}
