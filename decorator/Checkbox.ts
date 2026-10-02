import { expect } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';

export class Checkbox extends BaseElement {
  check(options?: Timeout): this {
    return this.chain(() => this.root.check(options));
  }

  uncheck(options?: Timeout): this {
    return this.chain(() => this.root.uncheck(options));
  }

  setChecked(checked: boolean, options?: Timeout): this {
    return this.chain(() => this.root.setChecked(checked, options));
  }

  toggle(options?: Timeout): this {
    return this.chain(async () => this.root.setChecked(!(await this.root.isChecked()), options));
  }

  checkIsChecked(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be checked`).toBeChecked(options));
  }

  checkIsUnchecked(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be unchecked`).not.toBeChecked(options));
  }
}
