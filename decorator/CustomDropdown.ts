import { expect, Locator } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';

export class CustomDropdown extends BaseElement {
  constructor(
    root: Locator,
    private readonly optionSelector: string = '[role="option"]',
  ) {
    super(root);
  }

  private get options(): Locator {
    return this.page.locator(this.optionSelector);
  }

  open(options?: Timeout): this {
    return this.chain(() => this.root.click(options));
  }

  chooseOption(label: string | RegExp, options?: Timeout): this {
    return this.chain(() => this.options.filter({ hasText: label }).first().click(options));
  }

  async getOptions(): Promise<string[]> {
    await this.flush();
    return (await this.options.allInnerTexts()).map((t) => t.trim());
  }

  checkHasSelected(label: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should show selected ${String(label)}`).toContainText(label, options),
    );
  }

  checkHasOptions(labels: (string | RegExp)[], options?: Timeout): this {
    return this.chain(() =>
      expect(this.options, `${this.name} should have options ${labels.join(', ')}`).toHaveText(labels, options),
    );
  }
}
