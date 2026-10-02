import { APIResponse } from '@playwright/test';
import { ApiRequest } from '../ApiRequest';
import { ApiStatus } from '../ApiStatus';
import { ApiHandler } from './ApiHandler';

export type TokenProvider = (refresh: boolean) => Promise<string>;

const SESSION_EXPIRED_STATUSES: readonly number[] = [ApiStatus.UNAUTHORIZED, ApiStatus.LOGGED_IN_ELSEWHERE];

export class AuthenticationHandler extends ApiHandler {
  constructor(private readonly tokenProvider: TokenProvider) {
    super();
  }

  async handle(request: ApiRequest): Promise<APIResponse> {
    if (!request.authenticated) {
      return super.handle(request);
    }
    const response = await super.handle(this.withToken(request, await this.tokenProvider(false)));
    if (!(await this.isSessionExpired(response))) {
      return response;
    }
    return super.handle(this.withToken(request, await this.tokenProvider(true)));
  }

  private withToken(request: ApiRequest, token: string): ApiRequest {
    return { ...request, headers: { ...request.headers, Authorization: `Bearer ${token}` } };
  }

  private async isSessionExpired(response: APIResponse): Promise<boolean> {
    const body: unknown = await response.json().catch(() => null);
    const statusCode = (body as { status_code?: number } | null)?.status_code;
    return statusCode !== undefined && SESSION_EXPIRED_STATUSES.includes(statusCode);
  }
}
