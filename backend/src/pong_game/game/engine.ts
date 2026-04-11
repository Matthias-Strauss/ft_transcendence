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

    this.ball.x += this.ballVx;
    this.ball.z += this.ballVz;

    if (Arena.hitsSideWall(this.ball)) {
      this.ballVx *= -1;
    }

    if (this.ballVz > 0 && Arena.paddleHit(this.ball, this.p1.paddleX, 'p1')) {
      this.ballVz *= -BALL_BOUNCE_MULT;
      if (Math.abs(this.ballVz) > BALL_MAX_SPEED) this.ballVz = -BALL_MAX_SPEED;
      this.ballVx = (this.ball.x - this.p1.paddleX) * BALL_PADDLE_OFFSET_MULT;
    }

    if (this.ballVz < 0 && Arena.paddleHit(this.ball, this.p2.paddleX, 'p2')) {
      this.ballVz *= -BALL_BOUNCE_MULT;
      if (Math.abs(this.ballVz) > BALL_MAX_SPEED) this.ballVz = BALL_MAX_SPEED;
      this.ballVx = (this.ball.x - this.p2.paddleX) * BALL_PADDLE_OFFSET_MULT;
    }

    if (Arena.ballPastP1(this.ball)) {
      this.p2.score += 1;
      this.resetBall(-1);
    } else if (Arena.ballPastP2(this.ball)) {
      this.p1.score += 1;
      this.resetBall(1);
    }

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
}
