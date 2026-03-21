import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Non-HTTP contexts (e.g. GraphQL) don't have HTTP request/response — skip
    if (context.getType<string>() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<{
      method: string;
      url: string;
    }>();
    const { method, url } = req;
    const start = Date.now();

    this.logger.log(`incoming request ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<{ statusCode: number }>();
          this.logger.log(
            `request completed ${method} ${url} ${res.statusCode} ${Date.now() - start}ms`,
          );
        },
        error: (err: { status?: number }) => {
          this.logger.error(
            `request failed ${method} ${url} ${err?.status ?? 500} ${Date.now() - start}ms`,
          );
        },
      }),
    );
  }
}
