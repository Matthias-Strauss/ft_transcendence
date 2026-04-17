import { GameInviteStatus, GameType, Prisma } from '@prisma/client';

import { prisma } from '../db.js';

export const GAME_INVITE_EXPIRY_MS = 5 * 60 * 1000;

const inviteInclude = {
  sender: {
    select: {
      id: true,
      username: true,
      displayname: true,
    },
  },
  recipient: {
    select: {
      id: true,
      username: true,
      displayname: true,
    },
  },
} satisfies Prisma.GameInviteInclude;

export type GameInviteWithUsers = Prisma.GameInviteGetPayload<{
  include: typeof inviteInclude;
}>;

export type PongInviteMetadata = {
  kind: 'pong_invite';
  inviteId: string;
  status: GameInviteStatus;
  expiresAt: string;
  game: 'pong';
};

export type PongNotificationMetadata = {
  kind: 'pong_notification';
  event:
    | 'invite_accepted'
    | 'invite_declined'
    | 'match_result'
    | 'opponent_left'
    | 'opponent_disconnected';
  inviteId: string;
  game: 'pong';
  matchId?: string;
  finalScore?: { p1: number; p2: number };
  winnerUsername?: string;
  endedByUsername?: string;
};

type InviteStatusUpdate = Exclude<GameInviteStatus, 'PENDING'>;

function now() {
  return new Date();
}

export async function findGameInviteById(inviteId: string) {
  return prisma.gameInvite.findUnique({
    where: { id: inviteId },
    include: inviteInclude,
  });
}

export async function cancelPendingGameInvites(
  senderId: string,
  recipientId: string,
  gameType: GameType = 'PONG',
) {
  const respondedAt = now();

  return prisma.gameInvite.updateMany({
    where: {
      senderId,
      recipientId,
      gameType,
      status: 'PENDING',
    },
    data: {
      status: 'CANCELED',
      respondedAt,
    },
  });
}

export async function expirePendingGameInvites(params: {
  senderId?: string;
  recipientId?: string;
  gameType?: GameType;
}) {
  const respondedAt = now();

  return prisma.gameInvite.updateMany({
    where: {
      senderId: params.senderId,
      recipientId: params.recipientId,
      gameType: params.gameType,
      status: 'PENDING',
      expiresAt: {
        lte: respondedAt,
      },
    },
    data: {
      status: 'EXPIRED',
      respondedAt,
    },
  });
}

export async function createPendingGameInvite(params: {
  senderId: string;
  recipientId: string;
  expiresAt: Date;
  gameType?: GameType;
}) {
  const gameType = params.gameType ?? 'PONG';

  await expirePendingGameInvites({
    senderId: params.senderId,
    recipientId: params.recipientId,
    gameType,
  });
  await cancelPendingGameInvites(params.senderId, params.recipientId, gameType);

  return prisma.gameInvite.create({
    data: {
      senderId: params.senderId,
      recipientId: params.recipientId,
      gameType,
      expiresAt: params.expiresAt,
    },
    include: inviteInclude,
  });
}

export async function updateGameInviteStatus(
  inviteId: string,
  status: InviteStatusUpdate,
  extraData: Prisma.GameInviteUpdateInput = {},
) {
  const respondedAt = now();

  return prisma.gameInvite.update({
    where: { id: inviteId },
    data: {
      status,
      respondedAt,
      acceptedAt: status === 'ACCEPTED' ? respondedAt : null,
      ...extraData,
    },
    include: inviteInclude,
  });
}

export async function expireGameInvite(inviteId: string) {
  return updateGameInviteStatus(inviteId, 'EXPIRED');
}

export async function declineGameInvite(inviteId: string) {
  return updateGameInviteStatus(inviteId, 'DECLINED');
}

export async function cancelGameInvite(inviteId: string) {
  return updateGameInviteStatus(inviteId, 'CANCELED');
}

export async function acceptGameInvite(inviteId: string, matchId?: string) {
  return updateGameInviteStatus(inviteId, 'ACCEPTED', matchId ? { matchId } : {});
}

export async function findAcceptedGameInviteByMatchId(matchId: string) {
  return prisma.gameInvite.findFirst({
    where: {
      matchId,
      status: 'ACCEPTED',
    },
    include: inviteInclude,
  });
}

export function isGameInviteExpired(invite: Pick<GameInviteWithUsers, 'expiresAt'>) {
  return invite.expiresAt.getTime() <= Date.now();
}

export function buildPongInviteMetadata(invite: Pick<GameInviteWithUsers, 'id' | 'status' | 'expiresAt'>) {
  return {
    kind: 'pong_invite',
    inviteId: invite.id,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    game: 'pong',
  } satisfies PongInviteMetadata;
}

export function buildPongNotificationMetadata(
  invite: Pick<GameInviteWithUsers, 'id'>,
  event: PongNotificationMetadata['event'],
  extra: Partial<Omit<PongNotificationMetadata, 'kind' | 'event' | 'inviteId' | 'game'>> = {},
) {
  return {
    kind: 'pong_notification',
    event,
    inviteId: invite.id,
    game: 'pong',
    ...extra,
  } satisfies PongNotificationMetadata;
}
