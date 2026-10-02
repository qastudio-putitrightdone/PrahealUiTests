import { expect, Locator } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';
import { Button } from './Button';

export class ErrorMessage extends BaseElement {
  private readonly closeButton: Button;

  constructor(root: Locator, closeButtonSelector: string = 'button') {
    super(root);
    this.closeButton = new Button(root.locator(closeButtonSelector));
  }

  clickCloseButton(options?: Timeout): this {
    return this.chain(() => this.closeButton.click(options));
  }

  checkContainsMessage(message: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should contain message ${String(message)}`).toContainText(message, options),
    );
  }
}
