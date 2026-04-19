// Keep in sync with frontend/game/pongConstants.ts — server and client must
// agree on every number below or physics will desync.

export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

export const WIN_SCORE = 5;

export const RECONNECT_GRACE_MS = 15000;

export const ARENA_WIDTH = 40;
export const ARENA_DEPTH = 80;

export const WALL_X_LIMIT = 19.2;
export const SCORE_Z_LIMIT = 40;

export const PADDLE_WIDTH = 6;
export const PADDLE_DEPTH = 0.5;
export const PADDLE_HALF_W = PADDLE_WIDTH / 2;
export const PADDLE_HALF_D = PADDLE_DEPTH / 2;
export const PADDLE_P1_Z = 36;
export const PADDLE_P2_Z = -36;
export const PADDLE_SPEED = 0.6;
export const PADDLE_LIMIT = 16;

export const BALL_DIAMETER = 1.5;
export const BALL_RADIUS = BALL_DIAMETER / 2;
export const BALL_START_VX_ABS = 0.3;
export const BALL_START_VZ_ABS = 0.45;
export const BALL_MAX_SPEED = 1.6;
export const BALL_BOUNCE_MULT = 1.1;
export const BALL_PADDLE_OFFSET_MULT = 0.1;
