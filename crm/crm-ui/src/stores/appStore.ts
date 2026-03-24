import { create } from 'zustand';

interface User {
  name: string;
  email: string;
  roles: string[];
}

interface AppStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

const useAppStore = create<AppStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  user: null,
  setUser: (user) => set({ user }),
}));

export default useAppStore;
