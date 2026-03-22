'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const inStock = product.inventory && product.inventory.quantity > 0;
  const quantity = product.inventory?.quantity ?? 0;

  return (
    <Link href={`/products/${product.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-muted">
            <span className="text-4xl font-bold text-muted-foreground">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
          {product.category && (
            <Badge variant="secondary" className="mt-2">
              {product.category.name}
            </Badge>
          )}
        </CardContent>
        <CardFooter>
          {inStock ? (
            <span className="text-sm font-medium text-green-600">
              In Stock ({quantity})
            </span>
          ) : (
            <span className="text-sm font-medium text-red-600">Out of Stock</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
