import { BaseElement, Timeout } from './BaseElement';

export class Link extends BaseElement {
  async getHref(): Promise<string | null> {
    return this.getAttribute('href');
  }

  checkHasHref(href: string | RegExp, options?: Timeout): this {
    return this.checkHasAttribute('href', href, options);
  }
}
