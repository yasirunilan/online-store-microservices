import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class InventoryType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  reservedQuantity!: number;

  @Field()
  updatedAt!: Date;
}
