import { ChatMessageType, Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { ChatErrors } from '../errors/catalog.js';
import { directMessageInclude } from '../utils/chatUtils.js';

export async function createDirectMessage(params: {
  senderId: string;
  recipientId: string;
  text: string;
  type?: ChatMessageType;
  metadata?: Prisma.InputJsonValue | undefined;
}) {
  if (params.senderId === params.recipientId) {
    throw ChatErrors.messageToSelfForbidden();
  }

  return prisma.directMessage.create({
    data: {
      senderId: params.senderId,
      recipientId: params.recipientId,
      text: params.text,
      type: params.type ?? 'TEXT',
      metadata: params.metadata,
    },
    include: directMessageInclude,
  });
}
