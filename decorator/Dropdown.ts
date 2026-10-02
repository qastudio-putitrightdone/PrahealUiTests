import { expect, Locator } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';

export class Dropdown extends BaseElement {
  private get options(): Locator {
    return this.root.locator('option');
  }

  private get selectedOptions(): Locator {
    return this.root.locator('option:checked');
  }

  selectByValue(value: string | string[], options?: Timeout): this {
    const values = Array.isArray(value) ? value : [value];
    return this.chain(() => this.root.selectOption(values.map((v) => ({ value: v })), options));
  }

  selectByLabel(label: string | string[], options?: Timeout): this {
    const labels = Array.isArray(label) ? label : [label];
    return this.chain(() => this.root.selectOption(labels.map((l) => ({ label: l })), options));
  }

  selectByIndex(index: number | number[], options?: Timeout): this {
    const indexes = Array.isArray(index) ? index : [index];
    return this.chain(() => this.root.selectOption(indexes.map((i) => ({ index: i })), options));
  }

  async getSelectedValue(options?: Timeout): Promise<string> {
    await this.flush();
    return this.root.inputValue(options);
  }

  async getSelectedLabels(): Promise<string[]> {
    await this.flush();
    return (await this.selectedOptions.allTextContents()).map((t) => t.trim());
  }

  async getOptions(): Promise<string[]> {
    await this.flush();
    return (await this.options.allTextContents()).map((t) => t.trim());
  }

  checkHasSelectedValue(value: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should have selected value ${String(value)}`).toHaveValue(value, options),
    );
  }

  checkHasSelectedValues(values: (string | RegExp)[], options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should have selected values ${values.join(', ')}`).toHaveValues(values, options),
    );
  }

  checkHasSelectedLabel(label: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.selectedOptions, `${this.name} should have selected label ${String(label)}`).toHaveText(
        label,
        options,
      ),
    );
  }

  checkHasOptions(labels: (string | RegExp)[], options?: Timeout): this {
    return this.chain(() =>
      expect(this.options, `${this.name} should have options ${labels.join(', ')}`).toHaveText(labels, options),
    );
  }

  checkContainsOption(label: string, options?: Timeout): this {
    return this.chain(() =>
      expect(this.options.filter({ hasText: label }), `${this.name} should contain option ${label}`).not.toHaveCount(
        0,
        options,
      ),
    );
  }
}
