import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Category, Inventory } from '../generated/prisma/client';
import { CategoryRepository } from '../category/category.repository';
import { InventoryRepository } from '../inventory/inventory.repository';

@Injectable({ scope: Scope.REQUEST })
export class DataLoadersService {
  readonly inventoryLoader: DataLoader<string, Inventory | null>;
  readonly categoryLoader: DataLoader<string, Category>;

  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {
    this.inventoryLoader = new DataLoader<string, Inventory | null>(
      async (productIds: readonly string[]) => {
        const inventories = await this.inventoryRepository.findByProductIds([...productIds]);
        const map = new Map(inventories.map((inv) => [inv.productId, inv]));
        return productIds.map((id) => map.get(id) ?? null);
      },
    );

    this.categoryLoader = new DataLoader<string, Category>(
      async (categoryIds: readonly string[]) => {
        const categories = await this.categoryRepository.findByIds([...categoryIds]);
        const map = new Map(categories.map((cat) => [cat.id, cat]));
        return categoryIds.map((id) => map.get(id)!);
      },
    );
  }
}
