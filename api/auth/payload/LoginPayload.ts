import { User } from '../../../user/User';
import { ApiConstants } from '../../core/ApiConstants';

export type LoginPayload = Readonly<{
  login_mobile: string;
  login_password: string;
  country_code: string;
  login_module_name: string;
}>;

export class LoginPayloadBuilder {
  private mobileNumber?: string;
  private password?: string;
  private countryCode: string = ApiConstants.DEFAULT_COUNTRY_CODE;
  private loginModuleName: string = ApiConstants.LOGIN_MODULE.STAFF;

  forUser(user: User): this {
    this.mobileNumber = user.mobileNumber;
    this.password = user.password;
    return this;
  }

  withMobileNumber(mobileNumber: string): this {
    this.mobileNumber = mobileNumber;
    return this;
  }

  withPassword(password: string): this {
    this.password = password;
    return this;
  }

  withCountryCode(countryCode: string): this {
    this.countryCode = countryCode;
    return this;
  }

  withLoginModuleName(loginModuleName: string): this {
    this.loginModuleName = loginModuleName;
    return this;
  }

  build(): LoginPayload {
    if (this.mobileNumber === undefined || this.password === undefined) {
      throw new Error('LoginPayloadBuilder: mobile number and password are required - use forUser() or withMobileNumber()/withPassword()');
    }
    return Object.freeze({
      login_mobile: this.mobileNumber,
      login_password: this.password,
      country_code: this.countryCode,
      login_module_name: this.loginModuleName,
    });
  }
}
