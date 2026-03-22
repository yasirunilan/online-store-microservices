import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/lib/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  _hydrated: boolean;
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      _hydrated: false,

      setTokens: (accessToken: string, refreshToken: string) =>
        set({ accessToken, refreshToken }),

      setUser: (user: UserProfile) => set({ user }),

      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null }),

      setHydrated: (hydrated: boolean) => set({ _hydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function getIsAuthenticated(): boolean {
  const { accessToken, user } = useAuthStore.getState();
  return !!accessToken && !!user;
}
