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
