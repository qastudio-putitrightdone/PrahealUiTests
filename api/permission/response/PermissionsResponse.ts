import { ApiStatus } from '../../core/ApiStatus';

type RawPermissionsResponse = {
  status_code: number;
  message: string;
  data?: string;
};

export class PermissionsResponse {
  private constructor(
    readonly statusCode: number,
    readonly message: string,
    readonly encryptedPermissions: string | null,
  ) {
    Object.freeze(this);
  }

  get isSuccess(): boolean {
    return this.statusCode === ApiStatus.SUCCESS;
  }

  static from(raw: RawPermissionsResponse): PermissionsResponse {
    return new PermissionsResponse(raw.status_code, raw.message, typeof raw.data === 'string' ? raw.data : null);
  }
}
