import { Page } from '@playwright/test';
import { Button, ErrorMessage, Input } from '../decorator';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly login_page_url = '/staff-login';

  protected readonly mobileField: Input;
  protected readonly passwordField: Input;
  protected readonly loginButton: Button;
  protected readonly loginErrorMessage: ErrorMessage;

  constructor(page: Page) {
    super(page);
    this.mobileField = this.input('input[placeholder="Mobile No."]');
    this.passwordField = this.input('input[placeholder="Password"]');
    this.loginButton = this.button('button[title="Login"]');
    this.loginErrorMessage = this.errorMessage('div[role="alert"]');
  }
}
