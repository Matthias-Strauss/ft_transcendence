import {
  BALL_BOUNCE_MULT,
  BALL_MAX_SPEED,
  BALL_PADDLE_OFFSET_MULT,
  BALL_RADIUS,
  BALL_START_VX_ABS,
  BALL_START_VZ_ABS,
  PADDLE_HALF_D,
  PADDLE_HALF_W,
  PADDLE_LIMIT,
  PADDLE_P1_Z,
  PADDLE_P2_Z,
  PADDLE_SPEED,
  SCORE_Z_LIMIT,
  WALL_X_LIMIT,
} from './pongConstants';

export type PongInput = { left: boolean; right: boolean };

export type PongSnapshot = {
  ball: { x: number; z: number };
  p1: { x: number };
  p2: { x: number };
  score: { p1: number; p2: number };
  t: number;
};

export class LocalPongSim {
  private state: PongSnapshot;
  private ballVx: number;
  private ballVz: number;
  private p1Input: PongInput = { left: false, right: false };
  private p2Input: PongInput = { left: false, right: false };

  constructor() {
    this.state = {
      ball: { x: 0, z: 0 },
      p1: { x: 0 },
      p2: { x: 0 },
      score: { p1: 0, p2: 0 },
      t: 0,
    };
    this.ballVx = BALL_START_VX_ABS;
    this.ballVz = BALL_START_VZ_ABS;
  }

  setInput(player: 'p1' | 'p2', input: PongInput) {
    if (player === 'p1') this.p1Input = input;
    else this.p2Input = input;
  }

  snapshot(): PongSnapshot {
    return this.state;
  }

  step() {
    this.movePaddle('p1');
    this.movePaddle('p2');

    this.state.ball.x += this.ballVx;
    this.state.ball.z += this.ballVz;

    if (this.state.ball.x <= -WALL_X_LIMIT || this.state.ball.x >= WALL_X_LIMIT) {
      this.ballVx *= -1;
    }

    if (this.ballVz > 0 && this.paddleHit('p1')) {
      this.ballVz *= -BALL_BOUNCE_MULT;
      if (Math.abs(this.ballVz) > BALL_MAX_SPEED) this.ballVz = -BALL_MAX_SPEED;
      this.ballVx = (this.state.ball.x - this.state.p1.x) * BALL_PADDLE_OFFSET_MULT;
    }

    if (this.ballVz < 0 && this.paddleHit('p2')) {
      this.ballVz *= -BALL_BOUNCE_MULT;
      if (Math.abs(this.ballVz) > BALL_MAX_SPEED) this.ballVz = BALL_MAX_SPEED;
      this.ballVx = (this.state.ball.x - this.state.p2.x) * BALL_PADDLE_OFFSET_MULT;
    }

    if (this.state.ball.z > SCORE_Z_LIMIT) {
      this.state.score.p2 += 1;
      this.resetBall(-1);
    } else if (this.state.ball.z < -SCORE_Z_LIMIT) {
      this.state.score.p1 += 1;
      this.resetBall(1);
    }

    this.state.t += 1;
  }

  private movePaddle(player: 'p1' | 'p2') {
    const input = player === 'p1' ? this.p1Input : this.p2Input;
    const pad = player === 'p1' ? this.state.p1 : this.state.p2;
    if (input.left && pad.x < PADDLE_LIMIT) pad.x += PADDLE_SPEED;
    if (input.right && pad.x > -PADDLE_LIMIT) pad.x -= PADDLE_SPEED;
  }

  private paddleHit(player: 'p1' | 'p2'): boolean {
    const pad = player === 'p1' ? this.state.p1 : this.state.p2;
    const padZ = player === 'p1' ? PADDLE_P1_Z : PADDLE_P2_Z;
    const dx = Math.abs(this.state.ball.x - pad.x);
    const dz = Math.abs(this.state.ball.z - padZ);
    return dx < PADDLE_HALF_W + BALL_RADIUS && dz < PADDLE_HALF_D + BALL_RADIUS;
  }

  private resetBall(signZ: number) {
    this.state.ball.x = 0;
    this.state.ball.z = 0;
    this.ballVx = BALL_START_VX_ABS * (Math.random() > 0.5 ? 1 : -1);
    this.ballVz = BALL_START_VZ_ABS * signZ;
  }
}
