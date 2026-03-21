import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Passport calls getRequest() to retrieve the HTTP request for JWT extraction.
  // In a GraphQL context the execution context type is 'graphql', not 'http',
  // so we must pull the request from the Apollo context instead.
  getRequest(context: ExecutionContext): unknown {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{ req: unknown }>().req;
    }
    return context.switchToHttp().getRequest();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
