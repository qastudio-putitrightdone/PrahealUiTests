import { APIResponse } from '@playwright/test';
import { ApiRequest } from '../ApiRequest';

export abstract class ApiHandler {
  private next?: ApiHandler;

  setNext(handler: ApiHandler): ApiHandler {
    this.next = handler;
    return handler;
  }

  async handle(request: ApiRequest): Promise<APIResponse> {
    if (!this.next) {
      throw new Error(`${this.constructor.name} is the last handler in the chain and cannot pass the request on`);
    }
    return this.next.handle(request);
  }
}
