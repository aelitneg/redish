export class NotFoundError extends Error {
  constructor(message, resource) {
    super(message);

    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
    this.resource = resource;
  }
}
