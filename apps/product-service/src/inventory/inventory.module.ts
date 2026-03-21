import { Module } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

@Module({
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryRepository, InventoryService],
})
export class InventoryModule {}
