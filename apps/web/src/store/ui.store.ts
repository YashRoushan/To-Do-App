import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  filters: {
    status?: string;
    tags?: string[];
    priority?: number;
    search?: string;
    dateRange?: { from?: string; to?: string };
  };
  setFilters: (filters: Partial<UIState['filters']>) => void;
  viewMode: 'kanban' | 'table' | 'calendar' | 'dashboard' | 'focus';
  setViewMode: (mode: UIState['viewMode']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  filters: {},
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  viewMode: 'kanban',
  setViewMode: (mode) => set({ viewMode: mode }),
}));

