'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, user, _hydrated } = useAuthStore();
  const isAuthenticated = !!accessToken && !!user;

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hydrated, isAuthenticated, router]);

  if (!_hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
