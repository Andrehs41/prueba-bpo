/**
 * Operational error with an HTTP status code.
 * Thrown anywhere; translated to a JSON response by the central errorHandler.
 */
export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
