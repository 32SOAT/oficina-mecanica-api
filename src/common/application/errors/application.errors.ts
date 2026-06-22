export abstract class ApplicationError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends ApplicationError {
  readonly statusCode = 404;
}

export class BadRequestError extends ApplicationError {
  readonly statusCode = 400;
}

export class ConflictError extends ApplicationError {
  readonly statusCode = 409;
}

export class UnauthorizedError extends ApplicationError {
  readonly statusCode = 401;
}
