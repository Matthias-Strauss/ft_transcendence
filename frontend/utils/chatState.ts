import {create} from 'zustand';

interface ChatState {
  targetUsername: string | null;
  panelOpen: boolean;
  setTargetUsername: (username: string) => void;
  clearTargetUsername: () => void;
  setPanelOpen: (isOpen: boolean) => void;
}

const useChatStore = create<ChatState>()((set) => ({
  targetUsername: null,
  panelOpen: false,
  setTargetUsername: (username) => set({ targetUsername: username }),
  clearTargetUsername: () => set({ targetUsername: null }),
  setPanelOpen: (isOpen) => set({ panelOpen: isOpen }),
}));

export default useChatStore;


export const useBearStore = create((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}));