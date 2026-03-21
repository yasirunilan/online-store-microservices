import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Category } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryInput } from './dto/create-category.input';

const CATEGORY_KEY = (id: string) => `category:${id}`;
const CATEGORIES_ALL_KEY = 'categories:all';
const CATEGORY_TTL = 300_000; // 5 minutes

@Injectable()
export class CategoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(): Promise<Category[]> {
    const cached = await this.cache.get<Category[]>(CATEGORIES_ALL_KEY);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    await this.cache.set(CATEGORIES_ALL_KEY, categories, CATEGORY_TTL);
    return categories;
  }

  async findById(id: string): Promise<Category | null> {
    const cached = await this.cache.get<Category>(CATEGORY_KEY(id));
    if (cached) return cached;

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (category) await this.cache.set(CATEGORY_KEY(id), category, CATEGORY_TTL);
    return category;
  }

  findByIds(ids: string[]): Promise<Category[]> {
    return this.prisma.category.findMany({ where: { id: { in: ids } } });
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const category = await this.prisma.category.create({ data: input });
    await this.cache.del(CATEGORIES_ALL_KEY);
    return category;
  }

  async delete(id: string): Promise<Category> {
    const category = await this.prisma.category.delete({ where: { id } });
    await this.cache.del(CATEGORY_KEY(id));
    await this.cache.del(CATEGORIES_ALL_KEY);
    return category;
  }
}
