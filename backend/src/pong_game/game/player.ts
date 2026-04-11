import { PADDLE_LIMIT, PADDLE_SPEED } from './constants.js';

export type PongInput = { left: boolean; right: boolean };

export class Player {
  readonly socketId: string;
  readonly username: string;
  paddleX: number;
  score: number;
  input: PongInput;

  constructor(socketId: string, username: string) {
    this.socketId = socketId;
    this.username = username;
    this.paddleX = 0;
    this.score = 0;
    this.input = { left: false, right: false };
  }

  setInput(input: PongInput) {
    this.input = input;
  }

  applyInput() {
    if (this.input.left && this.paddleX < PADDLE_LIMIT) this.paddleX += PADDLE_SPEED;
    if (this.input.right && this.paddleX > -PADDLE_LIMIT) this.paddleX -= PADDLE_SPEED;
  }
}
