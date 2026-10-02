import type { ApiClient } from '../core/ApiClient';
import { ApiConstants } from '../core/ApiConstants';
import { DropdownEndpoint } from './DropdownEndpoint';
import { CustomDropdownPayloadBuilder } from './payload/CustomDropdownPayload';
import { BranchesResponse } from './response/BranchesResponse';

export class DropdownApi {
  constructor(private readonly client: ApiClient) {}

  async getBranches(): Promise<BranchesResponse> {
    const response = await this.client.send({
      method: 'POST',
      endpoint: DropdownEndpoint.GET_CUSTOM_DROPDOWN_DETAILS,
      authenticated: true,
      multipart: new CustomDropdownPayloadBuilder().withModule(ApiConstants.DROPDOWN_MODULE.BRANCHES).build(),
    });
    return BranchesResponse.from(await response.json());
  }
}
