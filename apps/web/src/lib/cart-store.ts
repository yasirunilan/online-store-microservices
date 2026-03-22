'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/lib/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,

      addItem: (item: CartItem) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === item.productId);

        let nextItems: CartItem[];
        if (existing) {
          nextItems = items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          );
        } else {
          nextItems = [...items, item];
        }

        set({
          items: nextItems,
          totalItems: nextItems.reduce((sum, i) => sum + i.quantity, 0),
          totalAmount: nextItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        });
      },

      removeItem: (productId: string) => {
        const nextItems = get().items.filter((i) => i.productId !== productId);
        set({
          items: nextItems,
          totalItems: nextItems.reduce((sum, i) => sum + i.quantity, 0),
          totalAmount: nextItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          const nextItems = get().items.filter((i) => i.productId !== productId);
          set({
            items: nextItems,
            totalItems: nextItems.reduce((sum, i) => sum + i.quantity, 0),
            totalAmount: nextItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          });
          return;
        }

        const nextItems = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i,
        );
        set({
          items: nextItems,
          totalItems: nextItems.reduce((sum, i) => sum + i.quantity, 0),
          totalAmount: nextItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        });
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalAmount: 0 });
      },
    }),
    {
      name: 'cart-storage',
    },
  ),
);
