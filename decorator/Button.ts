import { expect, Locator, Response } from '@playwright/test';
import { BaseElement, Timeout } from './BaseElement';

export class Button extends BaseElement {
  click(options?: Parameters<Locator['click']>[0]): this {
    return this.chain(() => this.root.click(options));
  }

  doubleClick(options?: Parameters<Locator['dblclick']>[0]): this {
    return this.chain(() => this.root.dblclick(options));
  }

  rightClick(options?: Timeout): this {
    return this.chain(() => this.root.click({ ...options, button: 'right' }));
  }

  forceClick(options?: Timeout): this {
    return this.chain(() => this.root.click({ ...options, force: true }));
  }

  hover(options?: Parameters<Locator['hover']>[0]): this {
    return this.chain(() => this.root.hover(options));
  }

  clickAndWaitForResponse(url: string | RegExp | ((response: Response) => boolean), options?: Timeout): this {
    return this.chain(() => Promise.all([this.page.waitForResponse(url, options), this.root.click(options)]));
  }

  checkHasLabel(label: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should have label ${String(label)}`).toHaveAccessibleName(label, options),
    );
  }
}
