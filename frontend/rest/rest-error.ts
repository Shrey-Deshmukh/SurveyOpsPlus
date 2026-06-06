// Non-2xx REST responses are surfaced as this error (status + parsed body).

export class RestError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "RestError";
    this.status = status;
    this.body = body;
  }
}
