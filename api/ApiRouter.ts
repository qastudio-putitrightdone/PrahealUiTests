import { APIRequestContext } from '@playwright/test';
import { User } from '../user/User';
import { ApiClient } from './core/ApiClient';
import { UserApi } from './UserApi';

class UserRouter {
  private readonly apis = new Map<string, UserApi>();

  constructor(private readonly context: APIRequestContext) {}

  getUser(user: User): UserApi {
    let api = this.apis.get(user.mobileNumber);
    if (!api) {
      api = new UserApi(new ApiClient(this.context, user));
      this.apis.set(user.mobileNumber, api);
    }
    return api;
  }
}

export class ApiRouter {
  readonly user: UserRouter;

  constructor(context: APIRequestContext) {
    this.user = new UserRouter(context);
  }
}
