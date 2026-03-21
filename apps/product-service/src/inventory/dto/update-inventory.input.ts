import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, Min } from 'class-validator';

@InputType()
export class UpdateInventoryInput {
  @Field(() => ID)
  @IsString()
  productId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  quantity!: number;
}
