import { Locator, Page } from '@playwright/test';
import { BaseElement } from './BaseElement';

export type TextElementOptions = {
  exact?: boolean;
  selector?: string;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class TextElement extends BaseElement {
  constructor(page: Page, text: string | RegExp, options: TextElementOptions = {}) {
    super(TextElement.find(page, text, options).filter({ visible: true }));
  }

  private static find(page: Page, text: string | RegExp, { exact = true, selector }: TextElementOptions): Locator {
    if (!selector) {
      return page.getByText(text, { exact });
    }
    const hasText = exact && typeof text === 'string' ? new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`) : text;
    return page.locator(selector).filter({ hasText });
  }
}
