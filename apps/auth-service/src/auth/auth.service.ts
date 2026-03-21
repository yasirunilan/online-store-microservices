import { ConflictException, Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { UserRegisteredPayload } from '@online-store/shared-types';
import { QUEUE_CLIENT } from '@online-store/queue-client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { config } from '../config';
import { AuthRepository } from './auth.repository';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    @Inject(QUEUE_CLIENT) private readonly queueClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queueClient.connect();
  }

  async register(email: string, password: string): Promise<AuthResponseDto> {
    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await this.authRepository.createUser(email, hashedPassword);

    const payload: UserRegisteredPayload = {
      userId: user.id,
      email: user.email,
      registeredAt: user.createdAt.toISOString(),
    };
    this.queueClient.emit('user.registered', payload);

    return this.issueTokenPair(user.id, user.email);
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    void this.authRepository.deleteExpiredTokensForUser(user.id);

    return this.issueTokenPair(user.id, user.email);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.authRepository.revokeRefreshToken(stored.id);

    return this.issueTokenPair(stored.user.id, stored.user.email);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.authRepository.findRefreshTokenByHash(tokenHash);
    if (stored && !stored.isRevoked) {
      await this.authRepository.revokeRefreshToken(stored.id);
    }
  }

  private async issueTokenPair(userId: string, email: string): Promise<AuthResponseDto> {
    const accessToken = this.jwtService.sign({ sub: userId, email });

    const rawToken = crypto.randomUUID();
    const tokenHash = this.hashToken(rawToken);

    const refreshExpiryMs = this.parseExpiry(config.JWT_REFRESH_EXPIRY);
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await this.authRepository.createRefreshToken(userId, tokenHash, expiresAt);

    const expiresIn = Math.floor(this.parseExpiry(config.JWT_ACCESS_EXPIRY) / 1000);

    return { accessToken, refreshToken: rawToken, expiresIn };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 15 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * (multipliers[unit] ?? 60_000);
  }
}
