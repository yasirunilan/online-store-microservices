import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  sku?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
