import { Module } from '@nestjs/common';
import { CategoryModule } from '../category/category.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DataLoadersService } from './data-loaders.service';
import { ProductRepository } from './product.repository';
import { ProductResolver } from './product.resolver';
import { ProductService } from './product.service';

@Module({
  imports: [CategoryModule, InventoryModule],
  providers: [ProductResolver, ProductService, ProductRepository, DataLoadersService],
})
export class ProductModule {}
