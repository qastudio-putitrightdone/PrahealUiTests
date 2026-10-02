import type { ApiClient } from '../core/ApiClient';
import { User } from '../../user/User';
import { AuthEndpoint } from './AuthEndpoint';
import { LoginPayload, LoginPayloadBuilder } from './payload/LoginPayload';
import { LoggedInUser, LoginResponse } from './response/LoginResponse';

export class AuthApi {
  constructor(private readonly client: ApiClient) {}

  getSession(): Promise<LoggedInUser> {
    return this.client.getSession();
  }

  async login(credentials: User | LoginPayload): Promise<LoginResponse> {
    const payload = credentials instanceof User ? new LoginPayloadBuilder().forUser(credentials).build() : credentials;
    const response = await this.client.send({
      method: 'POST',
      endpoint: AuthEndpoint.LOGIN,
      authenticated: false,
      multipart: payload,
    });
    return LoginResponse.from(await response.json());
  }
}
