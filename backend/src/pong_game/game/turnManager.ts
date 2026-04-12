import type { Server as SocketIOServer } from 'socket.io';

import { TICK_MS } from './constants.js';
import { GameEngine } from './engine.js';
import { Player, type PongInput } from './player.js';

export type MatchEndReason = 'left' | 'disconnect';

type Match = {
  id: string;
  engine: GameEngine;
};

export type MatchManager = {
  join: (socketId: string, username: string) => void;
  setInput: (socketId: string, input: PongInput) => void;
  leave: (socketId: string, reason: MatchEndReason) => void;
  shutdown: () => void;
};

export function createMatchManager(io: SocketIOServer): MatchManager {
  const matches = new Map<string, Match>();
  const socketToMatchId = new Map<string, string>();
  const socketToSlot = new Map<string, 'p1' | 'p2'>();
  let waiting: { socketId: string; username: string } | null = null;
  let nextMatchId = 1;

  const tickTimer = setInterval(tick, TICK_MS);

  function tick() {
    for (const match of matches.values()) {
      match.engine.step();
      const snap = match.engine.snapshot();
      io.to(match.engine.p1.socketId).emit('pong:state', snap);
      io.to(match.engine.p2.socketId).emit('pong:state', snap);
    }
  }

  function join(socketId: string, username: string) {
    if (socketToMatchId.has(socketId)) return;

    if (!waiting) {
      waiting = { socketId, username };
      io.to(socketId).emit('pong:waiting');
      return;
    }

    if (waiting.socketId === socketId) return;

    const p1 = new Player(waiting.socketId, waiting.username);
    const p2 = new Player(socketId, username);
    const match: Match = {
      id: `m${nextMatchId++}`,
      engine: new GameEngine(p1, p2),
    };

    matches.set(match.id, match);
    socketToMatchId.set(p1.socketId, match.id);
    socketToMatchId.set(p2.socketId, match.id);
    socketToSlot.set(p1.socketId, 'p1');
    socketToSlot.set(p2.socketId, 'p2');

    io.to(p1.socketId).emit('pong:matched', {
      matchId: match.id,
      youAre: 'p1',
      opponent: p2.username,
    });
    io.to(p2.socketId).emit('pong:matched', {
      matchId: match.id,
      youAre: 'p2',
      opponent: p1.username,
    });

    waiting = null;
  }

  function setInput(socketId: string, input: PongInput) {
    const matchId = socketToMatchId.get(socketId);
    if (!matchId) return;
    const match = matches.get(matchId);
    if (!match) return;

    const slot = socketToSlot.get(socketId);
    if (slot === 'p1') match.engine.p1.setInput(input);
    else if (slot === 'p2') match.engine.p2.setInput(input);
  }

  function leave(socketId: string, reason: MatchEndReason) {
    if (waiting?.socketId === socketId) {
      waiting = null;
      return;
    }

    const matchId = socketToMatchId.get(socketId);
    if (!matchId) return;
    const match = matches.get(matchId);
    if (!match) return;

    const snap = match.engine.snapshot();
    const otherSocketId =
      match.engine.p1.socketId === socketId
        ? match.engine.p2.socketId
        : match.engine.p1.socketId;
    io.to(otherSocketId).emit('pong:ended', {
      reason,
      finalScore: snap.score,
    });

    matches.delete(matchId);
    socketToMatchId.delete(match.engine.p1.socketId);
    socketToMatchId.delete(match.engine.p2.socketId);
    socketToSlot.delete(match.engine.p1.socketId);
    socketToSlot.delete(match.engine.p2.socketId);
  }

  function shutdown() {
    clearInterval(tickTimer);
    matches.clear();
    socketToMatchId.clear();
    socketToSlot.clear();
    waiting = null;
  }

  return { join, setInput, leave, shutdown };
}
