import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserProfile } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const USER_KEY = (id: string) => `user:${id}`;
const USER_TTL = 300_000; // 5 minutes

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findById(id: string): Promise<UserProfile | null> {
    const cached = await this.cache.get<UserProfile>(USER_KEY(id));
    if (cached) return cached;

    const user = await this.prisma.userProfile.findUnique({ where: { id } });
    if (user) await this.cache.set(USER_KEY(id), user, USER_TTL);
    return user;
  }

  findByEmail(email: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({ where: { email } });
  }

  async create(id: string, email: string): Promise<UserProfile> {
    const user = await this.prisma.userProfile.upsert({
      where: { id },
      create: { id, email },
      update: {},
    });
    await this.cache.set(USER_KEY(id), user, USER_TTL);
    return user;
  }

  async update(id: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.prisma.userProfile.update({
      where: { id },
      data: dto,
    });
    await this.cache.set(USER_KEY(id), user, USER_TTL);
    return user;
  }
}
