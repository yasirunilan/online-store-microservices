import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { QueueClientModule } from '@online-store/queue-client';
import { config } from '../config';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (): JwtModuleOptions => ({
        privateKey: Buffer.from(config.JWT_PRIVATE_KEY, 'base64').toString('utf8'),
        publicKey: Buffer.from(config.JWT_PUBLIC_KEY, 'base64').toString('utf8'),
        signOptions: {
          algorithm: 'RS256',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: config.JWT_ACCESS_EXPIRY as any,
        },
      }),
    }),
    QueueClientModule.register(),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
