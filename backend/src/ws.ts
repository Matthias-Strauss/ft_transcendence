import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { APP_ORIGIN, FRONTEND_ORIGIN } from './config.js';
import { createMatchManager } from './pong_game/game/turnManager.js';
import { createDirectMessage } from './ws/chatHelper.js';
import { authenticateSocket } from './ws/auth.js';
import { emitDirectMessage } from './ws/chat.js';
import { bindConnectionHandler } from './ws/connection.js';
import { createUserSocketRegistry } from './ws/registry.js';
import { setRealtimeRuntime } from './ws/runtime.js';
import {
  buildPongNotificationMetadata,
  findAcceptedGameInviteByMatchId,
} from './utils/gameInvites.js';

export function setupWebSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    pingInterval: 3000,
    pingTimeout: 3000,
    cors: {
      origin: [APP_ORIGIN, FRONTEND_ORIGIN],
      credentials: true,
    },
  });

  const registry = createUserSocketRegistry();
  const matchManager = createMatchManager(io, async (params) => {
    const invite = await findAcceptedGameInviteByMatchId(params.matchId);
    if (!invite) {
      return;
    }

    let text: string;
    let metadata;

    if (params.reason === 'score') {
      const winnerUsername =
        params.finalScore.p1 > params.finalScore.p2
          ? params.players.p1.username
          : params.players.p2.username;
      text = 'Pong match finished';
      metadata = buildPongNotificationMetadata(invite, 'match_result', {
        matchId: params.matchId,
        finalScore: params.finalScore,
        winnerUsername,
      });
    } else if (params.reason === 'left') {
      text = 'Pong match ended: opponent left';
      metadata = buildPongNotificationMetadata(invite, 'opponent_left', {
        matchId: params.matchId,
        finalScore: params.finalScore,
        endedByUsername: params.endedBy?.username,
      });
    } else {
      text = 'Pong match ended: opponent disconnected';
      metadata = buildPongNotificationMetadata(invite, 'opponent_disconnected', {
        matchId: params.matchId,
        finalScore: params.finalScore,
        endedByUsername: params.endedBy?.username,
      });
    }

    const message = await createDirectMessage({
      senderId: invite.senderId,
      recipientId: invite.recipientId,
      text,
      type: 'GAME_NOTIFICATION',
      metadata,
    });

    emitDirectMessage(io, registry, message);
  });

  io.use(authenticateSocket);
  bindConnectionHandler(io, registry, matchManager);
  setRealtimeRuntime(io, registry);

  return io;
}
