import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { ProductsArgs } from './dto/products.args';
import { UpdateProductInput } from './dto/update-product.input';

const PRODUCT_KEY = (id: string) => `product:${id}`;
const PRODUCT_TTL = 300_000; // 5 minutes

@Injectable()
export class ProductRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  findAll(args: ProductsArgs): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: args.categoryId ? { categoryId: args.categoryId } : undefined,
      take: args.limit,
      skip: args.offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Product | null> {
    const cached = await this.cache.get<Product>(PRODUCT_KEY(id));
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (product) await this.cache.set(PRODUCT_KEY(id), product, PRODUCT_TTL);
    return product;
  }

  findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  async create(input: CreateProductInput): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        sku: input.sku,
        categoryId: input.categoryId,
      },
    });
    await this.cache.set(PRODUCT_KEY(product.id), product, PRODUCT_TTL);
    return product;
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      },
    });
    await this.cache.set(PRODUCT_KEY(id), product, PRODUCT_TTL);
    return product;
  }

  async delete(id: string): Promise<Product> {
    const product = await this.prisma.product.delete({ where: { id } });
    await this.cache.del(PRODUCT_KEY(id));
    return product;
  }
}
