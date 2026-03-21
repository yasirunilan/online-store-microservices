import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '@online-store/shared-middleware';
import { CategoryType } from '../category/types/category.type';
import { InventoryType } from '../inventory/types/inventory.type';
import { DataLoadersService } from './data-loaders.service';
import { CreateProductInput } from './dto/create-product.input';
import { ProductsArgs } from './dto/products.args';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductService } from './product.service';
import { ProductType } from './types/product.type';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => ProductType)
export class ProductResolver {
  constructor(
    private readonly productService: ProductService,
    private readonly dataLoaders: DataLoadersService,
  ) {}

  @Query(() => [ProductType])
  products(@Args() args: ProductsArgs): Promise<ProductType[]> {
    return this.productService.findAll(args) as unknown as Promise<ProductType[]>;
  }

  @Query(() => ProductType)
  product(@Args('id', { type: () => ID }) id: string): Promise<ProductType> {
    return this.productService.findById(id) as unknown as Promise<ProductType>;
  }

  @Mutation(() => ProductType)
  @UseGuards(JwtAuthGuard)
  createProduct(@Args('input') input: CreateProductInput): Promise<ProductType> {
    return this.productService.create(input) as unknown as Promise<ProductType>;
  }

  @Mutation(() => ProductType)
  @UseGuards(JwtAuthGuard)
  updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
  ): Promise<ProductType> {
    return this.productService.update(id, input) as unknown as Promise<ProductType>;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteProduct(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.productService.delete(id);
  }

  @ResolveField(() => CategoryType)
  category(@Parent() product: ProductType): Promise<CategoryType> {
    return this.dataLoaders.categoryLoader.load(product.categoryId) as unknown as Promise<CategoryType>;
  }

  @ResolveField(() => InventoryType, { nullable: true })
  inventory(@Parent() product: ProductType): Promise<InventoryType | null> {
    return this.dataLoaders.inventoryLoader.load(product.id) as unknown as Promise<InventoryType | null>;
  }
}
