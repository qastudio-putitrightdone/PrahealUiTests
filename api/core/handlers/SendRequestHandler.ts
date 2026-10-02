import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiConstants } from '../ApiConstants';
import { ApiRequest } from '../ApiRequest';
import { ApiHandler } from './ApiHandler';

export class SendRequestHandler extends ApiHandler {
  constructor(private readonly context: APIRequestContext) {
    super();
  }

  async handle(request: ApiRequest): Promise<APIResponse> {
    return this.context.fetch(`${ApiConstants.BASE_PATH}${request.endpoint}`, {
      method: request.method,
      headers: request.headers,
      params: request.params,
      multipart: request.multipart,
    });
  }
}
