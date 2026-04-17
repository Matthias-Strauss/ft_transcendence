import type { ChatMessage } from '../utils/chatState';
import type { NormalizedIncomingMessage } from './types';

export function formatTime(value?: string | number | Date) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function mapApiMessageToChatMessage(m: any): ChatMessage {
  return {
    id: m.id,
    user: m.isOwn ? 'You' : m.sender?.displayname ?? m.sender?.username ?? 'Player',
    message: m.text ?? '',
    time: formatTime(m.createdAt),
    isOwn: Boolean(m.isOwn),
    metadata: m.metadata ?? undefined,
  };
}

export function normalizeIncomingPayload(
  payload: any,
  meUsername: string | null,
  socketId: string | undefined,
): NormalizedIncomingMessage | null {
  if (!payload || typeof payload !== 'object') return null;

  if ('text' in payload && 'sender' in payload) {
    const senderUsername = payload.sender?.username ?? null;
    const recipientUsername = payload.recipient?.username ?? null;
    const isOwn = Boolean(payload.isOwn);
    const isDirect = Boolean(senderUsername && recipientUsername);

    let otherUsername: string | null = null;
    if (senderUsername && recipientUsername) {
      otherUsername = isOwn ? recipientUsername : senderUsername;
    } else if (meUsername) {
      otherUsername = senderUsername === meUsername ? recipientUsername : senderUsername;
    } else {
      otherUsername = senderUsername ?? recipientUsername;
    }

    if (senderUsername && recipientUsername && senderUsername === recipientUsername) {
      return null;
    }

    return {
      chatMessage: {
        id: payload.id ?? `${Date.now()}-${Math.random()}`,
        user: isOwn ? 'You' : payload.sender?.displayname ?? payload.sender?.username ?? 'Player',
        message: payload.text ?? '',
        time: formatTime(payload.createdAt),
        isOwn,
        metadata: payload.metadata ?? undefined,
      },
      otherUsername,
      senderUsername,
      recipientUsername,
      isDirect,
    };
  }

  const senderUsername = payload.username ?? null;
  const recipientUsername = payload.to ?? null;
  const isOwn = payload.from === socketId;
  const isDirect = Boolean(recipientUsername);

  let otherUsername: string | null = null;
  if (meUsername) {
    otherUsername = senderUsername === meUsername ? recipientUsername : senderUsername;
  } else {
    otherUsername = senderUsername ?? recipientUsername;
  }

  return {
    chatMessage: {
      id: payload.id ?? `${Date.now()}-${Math.random()}`,
      user: isOwn ? 'You' : senderUsername ?? 'Player',
      message: payload.text ?? '',
      time: formatTime(),
      isOwn,
      metadata: payload.metadata ?? undefined,
    },
    otherUsername,
    senderUsername,
    recipientUsername,
    isDirect,
  };
}

export function shouldShowMessageInActiveChat(
  activeTarget: string | null,
  senderUsername: string | null,
  recipientUsername: string | null,
) {
  if (!activeTarget) return false;
  return senderUsername === activeTarget || recipientUsername === activeTarget;
}
