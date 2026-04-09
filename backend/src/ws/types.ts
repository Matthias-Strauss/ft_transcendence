export type SocketUser = {
  id: string;
  username: string;
};

export type ChatMessagePayload = {
  text: string;
  to?: string;
};
