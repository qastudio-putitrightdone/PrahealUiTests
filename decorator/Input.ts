import { expect } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';

export class Input extends BaseElement {
  fill(value: string, options?: Timeout): this {
    return this.chain(() => this.root.fill(value, options));
  }

  type(value: string, options?: { delay?: number } & Timeout): this {
    return this.chain(() => this.root.pressSequentially(value, options));
  }

  clear(options?: Timeout): this {
    return this.chain(() => this.root.clear(options));
  }

  blur(options?: Timeout): this {
    return this.chain(() => this.root.blur(options));
  }

  async getValue(options?: Timeout): Promise<string> {
    await this.flush();
    return this.root.inputValue(options);
  }

  checkHasValue(value: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should have value ${String(value)}`).toHaveValue(value, options),
    );
  }

  checkIsEmpty(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be empty`).toBeEmpty(options));
  }

  checkIsEditable(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be editable`).toBeEditable(options));
  }

  checkIsReadOnly(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be read-only`).not.toBeEditable(options));
  }

  checkHasPlaceholder(placeholder: string | RegExp, options?: Timeout): this {
    return this.checkHasAttribute('placeholder', placeholder, options);
  }
}
