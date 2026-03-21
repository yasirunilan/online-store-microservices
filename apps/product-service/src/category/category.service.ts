import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '../generated/prisma/client';
import { CategoryRepository } from './category.repository';
import { CreateCategoryInput } from './dto/create-category.input';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.categoryRepository.findAll().then((cats) =>
      cats.find((c) => c.name.toLowerCase() === input.name.toLowerCase()),
    );
    if (existing) {
      throw new ConflictException(`Category '${input.name}' already exists`);
    }
    return this.categoryRepository.create(input);
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    await this.categoryRepository.delete(id);
    return true;
  }
}
