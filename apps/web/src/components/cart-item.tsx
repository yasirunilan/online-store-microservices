'use client';

import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType } from '@/lib/types';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{item.productName}</h3>
        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center tabular-nums">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-24 text-right font-medium tabular-nums">
        ${lineTotal.toFixed(2)}
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRemove(item.productId)}
        aria-label={`Remove ${item.productName}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
