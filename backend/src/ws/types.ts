export type SocketUser = {
  id: string;
  username: string;
};

export type ChatMessagePayload = {
  text: string;
  to?: string;
};

export type PongInputPayload = {
  left: boolean;
  right: boolean;
};

export type PongMatchedPayload = {
  matchId: string;
  youAre: 'p1' | 'p2';
  opponent: string;
};

export type PongEndedPayload = {
  reason: 'left' | 'disconnect' | 'score';
  finalScore: { p1: number; p2: number };
};
