import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ORDER_KEY = (id: string) => `order:${id}`;
const ORDER_TTL = 120_000; // 2 minutes — orders change status frequently

@Injectable()
export class OrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(data: {
    userId: string;
    email: string;
    totalAmount: number;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) {
    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        email: data.email,
        totalAmount: new Prisma.Decimal(data.totalAmount),
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: new Prisma.Decimal(item.price),
          })),
        },
      },
      include: { items: true },
    });
    await this.cache.set(ORDER_KEY(order.id), order, ORDER_TTL);
    return order;
  }

  async findById(id: string) {
    type OrderWithItems = NonNullable<Awaited<ReturnType<typeof this.prisma.order.findUnique<{ where: { id: string }; include: { items: true } }>>>>;
    const cached = await this.cache.get<OrderWithItems>(ORDER_KEY(id));
    if (cached) return cached;

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (order) await this.cache.set(ORDER_KEY(id), order, ORDER_TTL);
    return order;
  }

  findByUserId(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: { items: true },
    });
    await this.cache.set(ORDER_KEY(id), order, ORDER_TTL);
    return order;
  }

  findAll(pagination: { skip: number; take: number }) {
    return this.prisma.order.findMany({
      skip: pagination.skip,
      take: pagination.take,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
