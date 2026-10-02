import type { ApiClient } from '../core/ApiClient';
import { PermissionEndpoint } from './PermissionEndpoint';
import { PermissionsResponse } from './response/PermissionsResponse';

export class PermissionApi {
  constructor(private readonly client: ApiClient) {}

  async getPermissions(): Promise<PermissionsResponse> {
    const response = await this.client.send({
      method: 'GET',
      endpoint: PermissionEndpoint.GET_USER_PERMISSIONS,
      authenticated: true,
    });
    return PermissionsResponse.from(await response.json());
  }
}
