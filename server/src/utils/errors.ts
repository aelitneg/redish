import { ContentfulStatusCode } from 'hono/utils/http-status';

export class BaseError extends Error {
  code: string;
  name: string;
  status_code: ContentfulStatusCode;

  constructor(
    message: string,
    code: string,
    name: string,
    status_code: ContentfulStatusCode,
  ) {
    super(message);

    this.code = code;
    this.name = name;
    this.status_code = status_code;
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(message, 'BAD_REQUEST', 'BadRequestError', 400);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 'ForbiddenError', 403);
  }
}

export class NotFoundError extends BaseError {
  resource?: string;

  constructor(message: string, resource?: string) {
    super(message, 'NOT_FOUND', 'NotFoundError', 404);
    this.resource = resource;
  }
}
