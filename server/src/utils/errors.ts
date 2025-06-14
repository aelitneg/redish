import { ContentfulStatusCode } from 'hono/utils/http-status';
export class BadRequestError extends Error {
  code: string = 'BAD_REQUEST';
  name: string = 'BadRequestError';
  status_code: ContentfulStatusCode = 400;
  constructor(message: string) {
    super(message);
  }
}

export class ForbiddenError extends Error {
  code: string = 'FORBIDDEN';
  name: string = 'ForbiddenError';
  status_code: ContentfulStatusCode = 403;
  constructor(message: string = 'Forbidden') {
    super(message);
  }
}

export class NotFoundError extends Error {
  code: string = 'NOT_FOUND';
  name: string = 'NotFoundError';
  resource: string;
  constructor(message: string, resource: string) {
    super(message);
    this.resource = resource;
  }
}
