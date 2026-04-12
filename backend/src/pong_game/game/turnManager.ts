import type { Server as SocketIOServer } from 'socket.io';

import { TICK_MS, WIN_SCORE } from './constants.js';
import { GameEngine } from './engine.js';
import { Player, type PongInput } from './player.js';

export type MatchEndReason = 'left' | 'disconnect' | 'score';

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
    const ended: string[] = [];
    for (const [matchId, match] of matches) {
      match.engine.step();
      const snap = match.engine.snapshot();
      io.to(match.engine.p1.socketId).emit('pong:state', snap);
      io.to(match.engine.p2.socketId).emit('pong:state', snap);
      if (snap.score.p1 >= WIN_SCORE || snap.score.p2 >= WIN_SCORE) {
        ended.push(matchId);
      }
    }
    for (const matchId of ended) {
      const match = matches.get(matchId);
      if (!match) continue;
      endMatch(matchId, 'score', match.engine.snapshot().score);
    }
  }

  function endMatch(
    matchId: string,
    reason: MatchEndReason,
    finalScore: { p1: number; p2: number },
  ) {
    const match = matches.get(matchId);
    if (!match) return;

    const p1Id = match.engine.p1.socketId;
    const p2Id = match.engine.p2.socketId;
    io.to(p1Id).emit('pong:ended', { reason, finalScore });
    io.to(p2Id).emit('pong:ended', { reason, finalScore });

    matches.delete(matchId);
    socketToMatchId.delete(p1Id);
    socketToMatchId.delete(p2Id);
    socketToSlot.delete(p1Id);
    socketToSlot.delete(p2Id);
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

    endMatch(matchId, reason, match.engine.snapshot().score);
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
