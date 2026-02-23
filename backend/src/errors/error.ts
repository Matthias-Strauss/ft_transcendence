export type ErrorResponseBody = {
  success: false;
  message: string;
  errCode: string;
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errCode: string;

  constructor(opts: { statusCode: number; message: string; errCode: string}) {
    super(opts.message);
    this.name = 'AppError';
    this.statusCode = opts.statusCode;
    this.errCode = opts.errCode;
  }
}
