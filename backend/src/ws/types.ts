export type SocketUser = {
  id: string;
  username: string;
};

export type ChatMessagePayload = {
  text: string;
  to?: string;
};

export type PongHelloPayload = Record<string, never>;

export type PongWelcomePayload = {
  username: string;
  socketId: string;
};
