import { create } from 'zustand';

interface AppStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const useAppStore = create<AppStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

export default useAppStore;
