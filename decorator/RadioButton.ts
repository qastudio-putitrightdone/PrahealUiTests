import { expect } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';

export class RadioButton extends BaseElement {
  select(options?: Timeout): this {
    return this.chain(() => this.root.check(options));
  }

  checkIsSelected(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be selected`).toBeChecked(options));
  }

  checkIsNotSelected(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should not be selected`).not.toBeChecked(options));
  }
}
