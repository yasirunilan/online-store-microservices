import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../generated/prisma/client';
import { CategoryRepository } from '../category/category.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { CreateProductInput } from './dto/create-product.input';
import { ProductsArgs } from './dto/products.args';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductRepository } from './product.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  findAll(args: ProductsArgs): Promise<Product[]> {
    return this.productRepository.findAll(args);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new NotFoundException(`Category ${input.categoryId} not found`);
    }

    const existing = await this.productRepository.findBySku(input.sku);
    if (existing) {
      throw new ConflictException(`SKU '${input.sku}' already exists`);
    }

    const product = await this.productRepository.create(input);
    await this.inventoryRepository.createForProduct(product.id);
    return product;
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    await this.findById(id);

    if (input.categoryId) {
      const category = await this.categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new NotFoundException(`Category ${input.categoryId} not found`);
      }
    }

    if (input.sku) {
      const existing = await this.productRepository.findBySku(input.sku);
      if (existing && existing.id !== id) {
        throw new ConflictException(`SKU '${input.sku}' already exists`);
      }
    }

    return this.productRepository.update(id, input);
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    await this.productRepository.delete(id);
    return true;
  }
}
