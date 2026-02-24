import { ErrorCode } from '../ErrorCode';
import { HttpError } from './HttpError';

export class NotFound extends HttpError {
  public override statusCode = 404;

  public override code: ErrorCode;

  constructor(message?: any, code?: ErrorCode) {
    super();

    this.name = 'NotFound';
    this.message = message ?? 'Not Found';
    this.code = code ?? ErrorCode.NOT_FOUND;
  }
}
