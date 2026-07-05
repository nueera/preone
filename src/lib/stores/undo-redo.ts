import { create } from 'zustand';

/**
 * UndoRedoStore — Global action history for undo/redo across the app.
 * 
 * Every destructive action (delete, update, create) can push an entry.
 * Undo reverses the last action via a provided `undo` callback.
 * Redo re-applies it via a provided `redo` callback.
 * 
 * Usage:
 *   import { useUndoRedoStore } from '@/lib/stores/undo-redo';
 *   const { pushAction, undo, redo } = useUndoRedoStore();
 *   
 *   // When deleting a student:
 *   pushAction({
 *     description: 'Deleted student Rahul Sharma',
 *     undo: async () => { await api.restoreStudent(id); },
 *     redo: async () => { await api.deleteStudent(id); },
 *   });
 */

export interface ActionEntry {
  /** Unique ID for this action */
  id: string;
  /** Human-readable description shown in toast */
  description: string;
  /** Timestamp */
  timestamp: number;
  /** Callback to reverse the action */
  undo: () => Promise<void>;
  /** Callback to re-apply the action */
  redo: () => Promise<void>;
  /** Category for grouping (e.g. 'student', 'fee', 'class') */
  category?: string;
}

interface UndoRedoState {
  /** Stack of past actions (most recent last) */
  past: ActionEntry[];
  /** Stack of undone actions (most recent last) */
  future: ActionEntry[];
  /** Maximum history size */
  maxSize: number;
  /** Whether an undo/redo is in progress */
  isProcessing: boolean;

  /** Push a new action onto the history */
  pushAction: (action: Omit<ActionEntry, 'id' | 'timestamp'>) => void;
  /** Undo the last action */
  undo: () => Promise<ActionEntry | null>;
  /** Redo the last undone action */
  redo: () => Promise<ActionEntry | null>;
  /** Clear all history */
  clear: () => void;
  /** Whether undo is available */
  canUndo: () => boolean;
  /** Whether redo is available */
  canRedo: () => boolean;
}

export const useUndoRedoStore = create<UndoRedoState>((set, get) => ({
  past: [],
  future: [],
  maxSize: 50,
  isProcessing: false,

  pushAction: (action) => {
    const entry: ActionEntry = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    set((state) => {
      const past = [...state.past, entry];
      // Trim to max size
      if (past.length > state.maxSize) {
        past.splice(0, past.length - state.maxSize);
      }
      // Clear future when new action is pushed (standard undo/redo behavior)
      return { past, future: [] };
    });
  },

  undo: async () => {
    const { past, isProcessing } = get();
    if (past.length === 0 || isProcessing) return null;

    set({ isProcessing: true });
    const action = past[past.length - 1];

    try {
      await action.undo();
      set((state) => ({
        past: state.past.slice(0, -1),
        future: [...state.future, action],
        isProcessing: false,
      }));
      return action;
    } catch (error) {
      set({ isProcessing: false });
      console.error('Undo failed:', error);
      return null;
    }
  },

  redo: async () => {
    const { future, isProcessing } = get();
    if (future.length === 0 || isProcessing) return null;

    set({ isProcessing: true });
    const action = future[future.length - 1];

    try {
      await action.redo();
      set((state) => ({
        future: state.future.slice(0, -1),
        past: [...state.past, action],
        isProcessing: false,
      }));
      return action;
    } catch (error) {
      set({ isProcessing: false });
      console.error('Redo failed:', error);
      return null;
    }
  },

  clear: () => set({ past: [], future: [] }),
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
