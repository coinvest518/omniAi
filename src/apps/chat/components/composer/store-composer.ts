import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';


/// Composer Store

interface ComposerStore {

  startupText: string | null; // if not null, the composer will load this text at startup
  setStartupText: (text: string | null) => void;

}

const useComposerStore = create<ComposerStore>()(
  persist((set, _get) => ({

      startupText: null,
      setStartupText: (text: string | null) => set({ startupText: text }),

    }),
    {
      name: 'app-composer',
      version: 1,
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export const setComposerStartupText = (text: string | null) =>
  useComposerStore.getState().setStartupText(text);

export const useComposerStartupText = (): [string | null, (text: string | null) => void] =>
  useComposerStore(state => [state.startupText, state.setStartupText], shallow);