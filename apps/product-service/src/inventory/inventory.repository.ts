import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inventory } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const INVENTORY_KEY = (productId: string) => `inventory:${productId}`;
const INVENTORY_TTL = 60_000; // 1 minute — inventory changes frequently

@Injectable()
export class InventoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findByProductId(productId: string): Promise<Inventory | null> {
    const cached = await this.cache.get<Inventory>(INVENTORY_KEY(productId));
    if (cached) return cached;

    const inventory = await this.prisma.inventory.findUnique({ where: { productId } });
    if (inventory) await this.cache.set(INVENTORY_KEY(productId), inventory, INVENTORY_TTL);
    return inventory;
  }

  findByProductIds(productIds: string[]): Promise<Inventory[]> {
    return this.prisma.inventory.findMany({ where: { productId: { in: productIds } } });
  }

  async upsert(productId: string, quantity: number): Promise<Inventory> {
    const inventory = await this.prisma.inventory.upsert({
      where: { productId },
      create: { productId, quantity },
      update: { quantity },
    });
    await this.cache.set(INVENTORY_KEY(productId), inventory, INVENTORY_TTL);
    return inventory;
  }

  async createForProduct(productId: string): Promise<Inventory> {
    const inventory = await this.prisma.inventory.create({ data: { productId } });
    await this.cache.set(INVENTORY_KEY(productId), inventory, INVENTORY_TTL);
    return inventory;
  }
}
