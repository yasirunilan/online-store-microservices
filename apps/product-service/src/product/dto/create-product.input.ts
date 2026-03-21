import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @MinLength(1)
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  price!: number;

  @Field()
  @IsString()
  @MinLength(1)
  sku!: string;

  @Field(() => ID)
  @IsString()
  categoryId!: string;
}
