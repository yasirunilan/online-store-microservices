'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItemRow } from '@/components/cart-item';
import { useCartStore } from '@/lib/cart-store';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <>
          <div>
            {items.map((item, index) => (
              <div key={item.productId}>
                <CartItemRow
                  item={item}
                  onRemove={removeItem}
                  onUpdateQuantity={updateQuantity}
                />
                {index < items.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
              <p className="text-xl font-bold">
                Subtotal: ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            <Link href="/checkout">
              <Button>Proceed to Checkout</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
