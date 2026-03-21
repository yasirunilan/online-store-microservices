import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export const SERVICE_URLS = {
  auth: 'http://localhost:3001',
  user: 'http://localhost:3002',
  product: 'http://localhost:3003',
  order: 'http://localhost:3004',
  notification: 'http://localhost:3005',
  mailhog: 'http://localhost:8025',
} as const;

export function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 10_000,
    validateStatus: () => true, // never throw on HTTP status codes
  });
}

export const authClient = createClient(SERVICE_URLS.auth);
export const userClient = createClient(SERVICE_URLS.user);
export const productClient = createClient(SERVICE_URLS.product);
export const orderClient = createClient(SERVICE_URLS.order);
export const notificationClient = createClient(SERVICE_URLS.notification);
export const mailhogClient = createClient(SERVICE_URLS.mailhog);

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
