import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

@ArgsType()
export class ProductsArgs {
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  offset: number = 0;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
