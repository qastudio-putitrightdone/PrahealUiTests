import { ApiStatus } from '../../core/ApiStatus';

type RawLoggedInUser = {
  name: string;
  mobile: string;
  user_id: string;
  user_master_id: string;
  token: string;
  is_agreed_to_consent: number;
  firm_id: string;
  branch_ids: string;
  default_branch_id: string | null;
  user_pic: string;
  appointments_calendar_access: boolean;
};

type RawLoginResponse = {
  status_code: number;
  message: string;
  data?: Partial<RawLoggedInUser> & { invalidFieldName?: string };
};

export class LoggedInUser {
  private constructor(
    readonly name: string,
    readonly mobile: string,
    readonly userId: string,
    readonly userMasterId: string,
    readonly token: string,
    readonly isAgreedToConsent: boolean,
    readonly firmId: string,
    readonly branchIds: readonly string[],
    readonly defaultBranchId: string | null,
    readonly userPic: string,
    readonly appointmentsCalendarAccess: boolean,
    readonly raw: Readonly<Record<string, unknown>>,
  ) {
    Object.freeze(this);
  }

  static from(raw: RawLoggedInUser): LoggedInUser {
    return new LoggedInUser(
      raw.name,
      raw.mobile,
      raw.user_id,
      raw.user_master_id,
      raw.token,
      raw.is_agreed_to_consent === 1,
      raw.firm_id,
      Object.freeze(raw.branch_ids ? raw.branch_ids.split(',') : []),
      raw.default_branch_id,
      raw.user_pic,
      raw.appointments_calendar_access,
      Object.freeze({ ...raw }),
    );
  }
}

export class LoginResponse {
  private constructor(
    readonly statusCode: number,
    readonly message: string,
    readonly user: LoggedInUser | null,
    readonly invalidFieldName: string | null,
  ) {
    Object.freeze(this);
  }

  get isSuccess(): boolean {
    return this.statusCode === ApiStatus.SUCCESS;
  }

  static from(raw: RawLoginResponse): LoginResponse {
    const isSuccess = raw.status_code === ApiStatus.SUCCESS;
    return new LoginResponse(
      raw.status_code,
      raw.message,
      isSuccess && raw.data ? LoggedInUser.from(raw.data as RawLoggedInUser) : null,
      raw.data?.invalidFieldName ?? null,
    );
  }
}
