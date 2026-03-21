import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  requestId?: string;
  userId?: string;
}

// Singleton AsyncLocalStorage instance shared between the logger and the
// RequestIdInterceptor (in shared-middleware). The interceptor writes the
// requestId on each request; the logger reads it automatically so every
// log line carries the correlation ID without manual passing.
export const loggerStorage = new AsyncLocalStorage<LogContext>();
