import { PADDLE_LIMIT, PADDLE_SPEED } from './constants.js';

export type PongInput = { left: boolean; right: boolean };

export class Player {
  socketId: string;
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
    let nextPaddleX = this.paddleX;

    if (this.input.left) nextPaddleX += PADDLE_SPEED;
    if (this.input.right) nextPaddleX -= PADDLE_SPEED;

    this.paddleX = Math.max(-PADDLE_LIMIT, Math.min(PADDLE_LIMIT, nextPaddleX));
  }
}
