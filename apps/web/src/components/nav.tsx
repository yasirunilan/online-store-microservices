'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { logout as logoutApi } from '@/lib/api-client';

export function Nav() {
  const router = useRouter();
  const { accessToken, refreshToken, user, logout } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const isAuthenticated = !!accessToken && !!user;
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  async function handleLogout() {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch {
      // ignore logout errors
    }
    logout();
    router.push('/login');
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/products" className="text-lg font-bold">
            Online Store
          </Link>
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Products
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/cart"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cart{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
              </Link>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Profile
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
