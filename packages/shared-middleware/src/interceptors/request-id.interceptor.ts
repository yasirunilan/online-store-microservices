import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { loggerStorage } from '@online-store/shared-logger';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Non-HTTP contexts (e.g. GraphQL) don't have HTTP headers/response — skip
    if (context.getType<string>() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const res = context.switchToHttp().getResponse<{
      setHeader: (key: string, value: string) => void;
    }>();

    const requestId = req.headers['x-request-id'] ?? crypto.randomUUID();
    res.setHeader('x-request-id', requestId);

    // Run the rest of the request chain inside the AsyncLocalStorage context
    // so every log call within this request automatically includes the requestId.
    return new Observable<unknown>((subscriber) => {
      loggerStorage.run({ requestId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
