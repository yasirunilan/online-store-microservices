import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { loggerStorage } from '@online-store/shared-logger';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  requestId: string | null;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // GraphQL exceptions are handled by Apollo — rethrow so Apollo formats them
    if (host.getType<string>() === 'graphql') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: ErrorResponse) => void };
    }>();

    const requestId = loggerStorage.getStore()?.requestId ?? null;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exception instanceof HttpException
          ? exception.message
          : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status] ?? 'UNKNOWN',
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
