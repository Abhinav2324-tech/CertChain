import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      certificates: [],
      darkMode: true,
      setAuth: (authPayload) =>
        set({
          user: authPayload.user,
          role: authPayload.role,
        }),
      clearAuth: () =>
        set({
          user: null,
          role: null,
          certificates: [],
        }),
      setCertificates: (certificates) => set({ certificates }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    { name: 'certchain-ui-store' },
  ),
)
