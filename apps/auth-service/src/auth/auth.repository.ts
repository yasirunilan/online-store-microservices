import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RefreshToken, User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const USER_KEY = (id: string) => `auth-user:${id}`;
const USER_TTL = 300_000; // 5 minutes

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    const cached = await this.cache.get<User>(USER_KEY(id));
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) await this.cache.set(USER_KEY(id), user, USER_TTL);
    return user;
  }

  async createUser(email: string, hashedPassword: string): Promise<User> {
    const user = await this.prisma.user.create({ data: { email, password: hashedPassword } });
    await this.cache.set(USER_KEY(user.id), user, USER_TTL);
    return user;
  }

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: { userId, token: tokenHash, expiresAt },
    });
  }

  findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });
  }

  revokeRefreshToken(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  deleteExpiredTokensForUser(userId: string): void {
    void this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }
}
