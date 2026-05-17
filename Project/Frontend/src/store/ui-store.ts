import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isSidebarCollapsed: boolean;
    isCreateGroupModalOpen: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setCreateGroupModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            isCreateGroupModalOpen: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
            setCreateGroupModalOpen: (open: boolean) => set({ isCreateGroupModalOpen: open }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }), // Only persist sidebar state
        }
    )
);
