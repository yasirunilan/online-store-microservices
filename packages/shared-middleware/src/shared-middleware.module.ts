import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

// SharedMiddlewareModule provides JWT authentication for all services.
// Import this module in any service that needs to protect routes with @UseGuards(JwtAuthGuard).
//
// Requires JWT_PUBLIC_KEY env var to be set (base64-encoded RS256 public key PEM).
//
// RequestIdInterceptor, LoggingInterceptor, and GlobalExceptionFilter are not
// registered here — they should be applied globally in each service's main.ts
// via app.useGlobalInterceptors() and app.useGlobalFilters().
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtAuthGuard, JwtStrategy],
  exports: [JwtAuthGuard, JwtStrategy, PassportModule],
})
export class SharedMiddlewareModule {}
