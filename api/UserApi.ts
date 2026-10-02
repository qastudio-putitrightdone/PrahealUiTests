import { AuthApi } from './auth/AuthApi';
import { ApiClient } from './core/ApiClient';
import { DropdownApi } from './dropdown/DropdownApi';
import { PermissionApi } from './permission/PermissionApi';

export class UserApi {
  readonly auth: AuthApi;
  readonly permission: PermissionApi;
  readonly dropdown: DropdownApi;

  constructor(client: ApiClient) {
    this.auth = new AuthApi(client);
    this.permission = new PermissionApi(client);
    this.dropdown = new DropdownApi(client);
  }
}
