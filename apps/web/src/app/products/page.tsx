'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product-card';
import { fetchCategories, fetchProducts } from '@/lib/api-client';
import type { Category, Product } from '@/lib/types';

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (categoryId: string, currentOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: { limit: number; offset: number; categoryId?: string } = {
        limit: PAGE_SIZE,
        offset: currentOffset,
      };
      if (categoryId) {
        params.categoryId = categoryId;
      }
      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(params),
        fetchCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedCategory, offset);
  }, [selectedCategory, offset, loadData]);

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedCategory(e.target.value);
    setOffset(0);
  }

  function handlePrevious() {
    setOffset((prev) => Math.max(0, prev - PAGE_SIZE));
  }

  function handleNext() {
    setOffset((prev) => prev + PAGE_SIZE);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full sm:w-64"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mb-8 rounded-md border border-destructive bg-destructive/10 p-6 text-center">
          <p className="mb-4 text-destructive">{error}</p>
          <Button onClick={() => loadData(selectedCategory, offset)} variant="outline">
            Retry
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-6">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={offset === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={products.length < PAGE_SIZE}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
