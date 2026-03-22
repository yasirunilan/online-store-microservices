'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { createOrder } from '@/lib/api-client';

function CheckoutContent() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const clearCart = useCartStore((s) => s.clearCart);
  const [isLoading, setIsLoading] = useState(false);

  if (items.length === 0) {
    router.replace('/cart');
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      const order = await createOrder(
        user.email,
        items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      );
      clearCart();
      toast('Order placed successfully!');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to place order';
      toast(message, 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between text-sm"
          >
            <span>
              {item.productName} x {item.quantity}
            </span>
            <span className="font-medium tabular-nums">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between mb-8">
        <span className="text-xl font-bold">Total</span>
        <span className="text-xl font-bold tabular-nums">
          ${totalAmount.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Link href="/cart">
          <Button variant="outline">Back to Cart</Button>
        </Link>
        <Button onClick={handlePlaceOrder} disabled={isLoading}>
          {isLoading ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
