import type { ChatMessageType, Prisma } from '@prisma/client';

export type SocketUser = {
  id: string;
  username: string;
};

export type ChatMessagePayload = {
  text: string;
  to: string;
  type?: ChatMessageType;
  metadata?: Prisma.JsonObject | Prisma.JsonArray | null;
};

export type ChatTypingPayload = {
  to: string;
  isTyping: boolean;
};

export type ChatReadPayload = {
  with: string;
};

export type GameInviteCreatePayload = {
  to: string;
};

export type GameInviteRespondPayload = {
  inviteId: string;
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

export type PongOpponentDisconnectedPayload = {
  graceMs: number;
};

export type PongResumedPayload = {
  matchId: string;
  youAre: 'p1' | 'p2';
  opponent: string;
  score: { p1: number; p2: number };
};
