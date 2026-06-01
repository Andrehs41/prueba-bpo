/**
 * Error operacional con un código de estado HTTP.
 * Se lanza en cualquier punto; el errorHandler central lo traduce a una
 * respuesta JSON.
 */
export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
