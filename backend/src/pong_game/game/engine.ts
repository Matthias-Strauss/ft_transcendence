import { Arena } from './arena.js';
import {
  BALL_BOUNCE_MULT,
  BALL_MAX_SPEED,
  BALL_PADDLE_OFFSET_MULT,
  BALL_START_VX_ABS,
  BALL_START_VZ_ABS,
} from './constants.js';
import { Player } from './player.js';

export type PongSnapshot = {
  ball: { x: number; z: number };
  p1: { x: number };
  p2: { x: number };
  score: { p1: number; p2: number };
  t: number;
};

export class GameEngine {
  readonly p1: Player;
  readonly p2: Player;
  private ball: { x: number; z: number };
  private ballVx: number;
  private ballVz: number;
  private tick: number;

  constructor(p1: Player, p2: Player) {
    this.p1 = p1;
    this.p2 = p2;
    this.ball = { x: 0, z: 0 };
    this.ballVx = BALL_START_VX_ABS;
    this.ballVz = BALL_START_VZ_ABS;
    this.tick = 0;
  }

  step() {
    this.p1.applyInput();
    this.p2.applyInput();

    this.moveBall();
    this.bounceOffSideWall();
    this.tryBounceOffPaddle(this.p1, 'p1', 1);
    this.tryBounceOffPaddle(this.p2, 'p2', -1);
    this.tryAwardPoint();

    this.tick += 1;
  }

  snapshot(): PongSnapshot {
    return {
      ball: { x: this.ball.x, z: this.ball.z },
      p1: { x: this.p1.paddleX },
      p2: { x: this.p2.paddleX },
      score: { p1: this.p1.score, p2: this.p2.score },
      t: this.tick,
    };
  }

  private resetBall(signZ: number) {
    this.ball.x = 0;
    this.ball.z = 0;
    this.ballVx = BALL_START_VX_ABS * (Math.random() > 0.5 ? 1 : -1);
    this.ballVz = BALL_START_VZ_ABS * signZ;
  }

  private moveBall() {
    this.ball.x += this.ballVx;
    this.ball.z += this.ballVz;
  }

  private bounceOffSideWall() {
    if (Arena.hitsSideWall(this.ball)) {
      this.ballVx *= -1;
    }
  }

  private tryBounceOffPaddle(player: Player, slot: 'p1' | 'p2', direction: 1 | -1) {
    if (Math.sign(this.ballVz) !== direction) return;
    if (!Arena.paddleHit(this.ball, player.paddleX, slot)) return;

    this.ballVz = this.cappedBallVz(-this.ballVz * BALL_BOUNCE_MULT, direction);
    this.ballVx = (this.ball.x - player.paddleX) * BALL_PADDLE_OFFSET_MULT;
  }

  private cappedBallVz(nextBallVz: number, direction: 1 | -1) {
    return Math.min(Math.abs(nextBallVz), BALL_MAX_SPEED) * -direction;
  }

  private tryAwardPoint() {
    if (Arena.ballPastP1(this.ball)) {
      this.awardPoint(this.p2, -1);
      return;
    }

    if (Arena.ballPastP2(this.ball)) {
      this.awardPoint(this.p1, 1);
    }
  }

  private awardPoint(player: Player, nextServeDirection: number) {
    player.score += 1;
    this.resetBall(nextServeDirection);
  }
}
