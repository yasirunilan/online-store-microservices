'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { fetchProduct } from '@/lib/api-client';
import { useCartStore } from '@/lib/cart-store';
import type { Product } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProduct(params.id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const availableQuantity = product?.inventory?.quantity ?? 0;
  const inStock = availableQuantity > 0;

  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
    });
    toast('Added to cart!');
  }

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else if (val > availableQuantity) {
      setQuantity(availableQuantity);
    } else {
      setQuantity(val);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-5 w-32" />
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md border border-destructive bg-destructive/10 p-6 text-center">
          <p className="mb-4 text-destructive">{error}</p>
          <Button onClick={loadProduct} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-lg bg-muted">
          <span className="text-6xl font-bold text-muted-foreground">
            {product.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {product.category && (
            <Badge variant="secondary" className="mt-2">
              {product.category.name}
            </Badge>
          )}

          <p className="mt-4 text-4xl font-bold">${product.price.toFixed(2)}</p>

          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}

          <Separator className="my-6" />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              SKU: {product.sku}
            </p>
            <p className="text-sm">
              {inStock ? (
                <span className="font-medium text-green-600">
                  In Stock ({availableQuantity} available)
                </span>
              ) : (
                <span className="font-medium text-red-600">Out of Stock</span>
              )}
            </p>
          </div>

          <Separator className="my-6" />

          <div className="flex items-end gap-4">
            <div className="w-24">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={availableQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={!inStock}
              />
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              size="lg"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
