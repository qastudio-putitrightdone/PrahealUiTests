import { ApiStatus } from '../../core/ApiStatus';

type RawBranch = {
  id: string;
  value: string;
  is_active: boolean;
};

type RawBranchesResponse = {
  status_code: number;
  message: string;
  data?: { branchDetails?: RawBranch[] };
};

export class Branch {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly isActive: boolean,
  ) {
    Object.freeze(this);
  }

  static from(raw: RawBranch): Branch {
    return new Branch(raw.id, raw.value, raw.is_active);
  }
}

export class BranchesResponse {
  private constructor(
    readonly statusCode: number,
    readonly message: string,
    readonly branches: readonly Branch[],
  ) {
    Object.freeze(this);
  }

  get isSuccess(): boolean {
    return this.statusCode === ApiStatus.SUCCESS;
  }

  static from(raw: RawBranchesResponse): BranchesResponse {
    return new BranchesResponse(
      raw.status_code,
      raw.message,
      Object.freeze((raw.data?.branchDetails ?? []).map((branch) => Branch.from(branch))),
    );
  }
}
