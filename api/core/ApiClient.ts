import { APIRequestContext, APIResponse } from '@playwright/test';
import { User } from '../../user/User';
import { AuthApi } from '../auth/AuthApi';
import type { LoggedInUser } from '../auth/response/LoginResponse';
import { ApiRequest } from './ApiRequest';
import { ApiHandler } from './handlers/ApiHandler';
import { AuthenticationHandler } from './handlers/AuthenticationHandler';
import { ReportingHandler } from './handlers/ReportingHandler';
import { SendRequestHandler } from './handlers/SendRequestHandler';

export class ApiClient {
  private readonly chain: ApiHandler;
  private session?: Promise<LoggedInUser>;

  constructor(
    context: APIRequestContext,
    readonly user: User,
  ) {
    this.chain = new ReportingHandler();
    this.chain
      .setNext(new AuthenticationHandler(async (refresh) => (await this.getSession(refresh)).token))
      .setNext(new SendRequestHandler(context));
  }

  send(request: ApiRequest): Promise<APIResponse> {
    return this.chain.handle(request);
  }

  getSession(refresh = false): Promise<LoggedInUser> {
    if (refresh || !this.session) {
      this.session = this.authenticate();
    }
    return this.session;
  }

  private async authenticate(): Promise<LoggedInUser> {
    const response = await new AuthApi(this).login(this.user);
    if (!response.user) {
      throw new Error(`Authentication failed for ${this.user}: [${response.statusCode}] ${response.message}`);
    }
    return response.user;
  }
}
