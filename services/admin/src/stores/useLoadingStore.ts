import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LoadingState {
  // State
  isLoading: boolean;
  loadingMessage: string | null;
  loadingTasks: Set<string>;
  
  // Actions
  startLoading: (taskId?: string, message?: string) => void;
  stopLoading: (taskId?: string) => void;
  setLoadingMessage: (message: string | null) => void;
  clearLoading: () => void;
}

export const useLoadingStore = create<LoadingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isLoading: false,
      loadingMessage: null,
      loadingTasks: new Set<string>(),
      
      // Actions
      startLoading: (taskId = 'default', message) => {
        const tasks = new Set(get().loadingTasks);
        tasks.add(taskId);
        set({
          isLoading: true,
          loadingTasks: tasks,
          loadingMessage: message || get().loadingMessage,
        });
      },
      
      stopLoading: (taskId = 'default') => {
        const tasks = new Set(get().loadingTasks);
        tasks.delete(taskId);
        set({
          isLoading: tasks.size > 0,
          loadingTasks: tasks,
          loadingMessage: tasks.size > 0 ? get().loadingMessage : null,
        });
      },
      
      setLoadingMessage: (message) => {
        set({ loadingMessage: message });
      },
      
      clearLoading: () => {
        set({
          isLoading: false,
          loadingMessage: null,
          loadingTasks: new Set<string>(),
        });
      },
    }),
    { name: 'LoadingStore' }
  )
);

// Selectors
export const selectIsLoading = (state: LoadingState) => state.isLoading;
export const selectLoadingMessage = (state: LoadingState) => state.loadingMessage;
