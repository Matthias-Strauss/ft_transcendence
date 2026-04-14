import {
  BALL_RADIUS,
  PADDLE_HALF_D,
  PADDLE_HALF_W,
  PADDLE_P1_Z,
  PADDLE_P2_Z,
  SCORE_Z_LIMIT,
  WALL_X_LIMIT,
} from './constants.js';

export type Ball = { x: number; z: number };

export class Arena {
  static hitsSideWall(ball: Ball): boolean {
    return ball.x <= -WALL_X_LIMIT || ball.x >= WALL_X_LIMIT;
  }

  static ballPastP1(ball: Ball): boolean {
    return ball.z > SCORE_Z_LIMIT;
  }

  static ballPastP2(ball: Ball): boolean {
    return ball.z < -SCORE_Z_LIMIT;
  }

  static paddleHit(ball: Ball, paddleX: number, slot: 'p1' | 'p2'): boolean {
    const padZ = slot === 'p1' ? PADDLE_P1_Z : PADDLE_P2_Z;
    const dx = Math.abs(ball.x - paddleX);
    const dz = Math.abs(ball.z - padZ);
    return dx < PADDLE_HALF_W + BALL_RADIUS && dz < PADDLE_HALF_D + BALL_RADIUS;
  }
}
