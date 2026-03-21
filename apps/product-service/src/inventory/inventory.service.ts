import { Injectable, NotFoundException } from '@nestjs/common';
import { Inventory } from '../generated/prisma/client';
import { UpdateInventoryInput } from './dto/update-inventory.input';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async updateStock(input: UpdateInventoryInput): Promise<Inventory> {
    return this.inventoryRepository.upsert(input.productId, input.quantity);
  }

  async findByProductId(productId: string): Promise<Inventory | null> {
    return this.inventoryRepository.findByProductId(productId);
  }
}
