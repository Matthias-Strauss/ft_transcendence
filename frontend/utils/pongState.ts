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
  restoredFromStorage: boolean;
  setActiveMatch: (match: ActivePongMatch) => void;
  clearActiveMatch: () => void;
  acknowledgeRestoredMatch: () => void;
};

const STORAGE_KEY = 'ft_transcendence.activePongMatch';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readStoredActiveMatch(): ActivePongMatch | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ActivePongMatch> | null;
    if (
      !parsed ||
      typeof parsed.matchId !== 'string' ||
      (parsed.youAre !== 'p1' && parsed.youAre !== 'p2') ||
      typeof parsed.opponent !== 'string' ||
      !parsed.score ||
      typeof parsed.score.p1 !== 'number' ||
      typeof parsed.score.p2 !== 'number'
    ) {
      return null;
    }

    return {
      matchId: parsed.matchId,
      youAre: parsed.youAre,
      opponent: parsed.opponent,
      score: {
        p1: parsed.score.p1,
        p2: parsed.score.p2,
      },
    };
  } catch {
    return null;
  }
}

function writeStoredActiveMatch(match: ActivePongMatch | null): void {
  if (!isBrowser()) {
    return;
  }

  try {
    if (!match) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(match));
  } catch {
    // do nothing
  }
}

const initialActiveMatch = readStoredActiveMatch();

const usePongStore = create<PongState>()((set) => ({
  activeMatch: initialActiveMatch,
  restoredFromStorage: Boolean(initialActiveMatch),
  setActiveMatch: (match) => {
    writeStoredActiveMatch(match);
    set({ activeMatch: match, restoredFromStorage: false });
  },
  clearActiveMatch: () => {
    writeStoredActiveMatch(null);
    set({ activeMatch: null, restoredFromStorage: false });
  },
  acknowledgeRestoredMatch: () => set({ restoredFromStorage: false }),
}));

export default usePongStore;
