import { create } from 'zustand';

type Slot = 'p1' | 'p2';

export type ActivePongMatch = {
  matchId: string;
  youAre: Slot;
  opponent: string;
  score: {
    p1: number;
    p2: number;
  };
};

type PongState = {
  activeMatch: ActivePongMatch | null;
  setActiveMatch: (match: ActivePongMatch) => void;
  clearActiveMatch: () => void;
};

const usePongStore = create<PongState>()((set) => ({
  activeMatch: null,
  setActiveMatch: (match) => set({ activeMatch: match }),
  clearActiveMatch: () => set({ activeMatch: null }),
}));

export default usePongStore;
