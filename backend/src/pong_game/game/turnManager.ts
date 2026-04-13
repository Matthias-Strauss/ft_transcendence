import type { Server as SocketIOServer } from 'socket.io';

import { RECONNECT_GRACE_MS, TICK_MS, WIN_SCORE } from './constants.js';
import { GameEngine } from './engine.js';
import { Player, type PongInput } from './player.js';

export type MatchEndReason = 'left' | 'disconnect' | 'score';

type Slot = 'p1' | 'p2';

type Match = {
  id: string;
  engine: GameEngine;
  paused: { slot: Slot; timer: NodeJS.Timeout; username: string } | null;
};

export type MatchManager = {
  join: (socketId: string, username: string) => void;
  setInput: (socketId: string, input: PongInput) => void;
  leave: (socketId: string, reason: MatchEndReason) => void;
  reconnect: (socketId: string, username: string) => boolean;
  shutdown: () => void;
};

export function createMatchManager(io: SocketIOServer): MatchManager {
  const matches = new Map<string, Match>();
  const socketToMatchId = new Map<string, string>();
  const socketToSlot = new Map<string, Slot>();
  const pendingReconnects = new Map<string, string>();
  let waiting: { socketId: string; username: string } | null = null;
  let nextMatchId = 1;

  const tickTimer = setInterval(tick, TICK_MS);

  function tick() {
    const ended: string[] = [];
    for (const [matchId, match] of matches) {
      if (match.paused) continue;
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

    if (match.paused) {
      clearTimeout(match.paused.timer);
      pendingReconnects.delete(match.paused.username);
      match.paused = null;
    }

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

  function pauseForReconnect(matchId: string, socketId: string) {
    const match = matches.get(matchId);
    if (!match) return;
    const slot = socketToSlot.get(socketId);
    if (!slot) return;

    const player = slot === 'p1' ? match.engine.p1 : match.engine.p2;
    const opponent = slot === 'p1' ? match.engine.p2 : match.engine.p1;

    socketToMatchId.delete(socketId);
    socketToSlot.delete(socketId);

    const timer = setTimeout(() => {
      endMatch(matchId, 'disconnect', match.engine.snapshot().score);
    }, RECONNECT_GRACE_MS);

    match.paused = { slot, timer, username: player.username };
    pendingReconnects.set(player.username, matchId);

    io.to(opponent.socketId).emit('pong:opponent_disconnected', {
      graceMs: RECONNECT_GRACE_MS,
    });
  }

  function reconnect(socketId: string, username: string): boolean {
    const matchId = pendingReconnects.get(username);
    if (!matchId) return false;
    const match = matches.get(matchId);
    if (!match || !match.paused) {
      pendingReconnects.delete(username);
      return false;
    }

    clearTimeout(match.paused.timer);
    const slot = match.paused.slot;
    const player = slot === 'p1' ? match.engine.p1 : match.engine.p2;
    const opponent = slot === 'p1' ? match.engine.p2 : match.engine.p1;

    player.socketId = socketId;
    match.paused = null;
    pendingReconnects.delete(username);
    socketToMatchId.set(socketId, matchId);
    socketToSlot.set(socketId, slot);

    io.to(socketId).emit('pong:resumed', {
      matchId,
      youAre: slot,
      opponent: opponent.username,
      score: match.engine.snapshot().score,
    });
    io.to(opponent.socketId).emit('pong:opponent_returned');
    return true;
  }

  function join(socketId: string, username: string) {
    if (socketToMatchId.has(socketId)) return;
    if (pendingReconnects.has(username)) return;

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
      paused: null,
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
    if (!match || match.paused) return;

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

    if (reason === 'disconnect' && !match.paused) {
      pauseForReconnect(matchId, socketId);
      return;
    }

    endMatch(matchId, reason, match.engine.snapshot().score);
  }

  function shutdown() {
    clearInterval(tickTimer);
    for (const match of matches.values()) {
      if (match.paused) clearTimeout(match.paused.timer);
    }
    matches.clear();
    socketToMatchId.clear();
    socketToSlot.clear();
    pendingReconnects.clear();
    waiting = null;
  }

  return { join, setInput, leave, reconnect, shutdown };
}
