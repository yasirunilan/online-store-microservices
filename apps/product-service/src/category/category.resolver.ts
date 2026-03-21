import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@online-store/shared-middleware';
import { CategoryService } from './category.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { CategoryType } from './types/category.type';

@Resolver(() => CategoryType)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => [CategoryType])
  categories(): Promise<CategoryType[]> {
    return this.categoryService.findAll() as Promise<CategoryType[]>;
  }

  @Query(() => CategoryType)
  category(@Args('id', { type: () => ID }) id: string): Promise<CategoryType> {
    return this.categoryService.findById(id) as Promise<CategoryType>;
  }

  @Mutation(() => CategoryType)
  @UseGuards(JwtAuthGuard)
  createCategory(@Args('input') input: CreateCategoryInput): Promise<CategoryType> {
    return this.categoryService.create(input) as Promise<CategoryType>;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deleteCategory(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.categoryService.delete(id);
  }
}
