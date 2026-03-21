import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { CategoryType } from '../../category/types/category.type';
import { InventoryType } from '../../inventory/types/inventory.type';

@ObjectType()
export class ProductType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price!: number;

  @Field()
  sku!: string;

  @Field(() => ID)
  categoryId!: string;

  // Resolved via @ResolveField in ProductResolver using DataLoader
  @Field(() => CategoryType)
  category!: CategoryType;

  // Resolved via @ResolveField in ProductResolver using DataLoader
  @Field(() => InventoryType, { nullable: true })
  inventory?: InventoryType;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
