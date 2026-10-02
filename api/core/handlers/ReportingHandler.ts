import { APIResponse, test } from '@playwright/test';
import { ApiRequest } from '../ApiRequest';
import { ApiHandler } from './ApiHandler';

export class ReportingHandler extends ApiHandler {
  async handle(request: ApiRequest): Promise<APIResponse> {
    return test.step(`API ${request.method} ${request.endpoint}`, () => super.handle(request));
  }
}
