import { expect, Locator, Page } from '@playwright/test';

export type Timeout = { timeout?: number };
export type WaitState = 'attached' | 'detached' | 'visible' | 'hidden';

type Step = () => PromiseLike<unknown>;

export class BaseElement implements PromiseLike<void> {
  readonly name: string;
  private steps: Step[] = [];

  constructor(protected readonly root: Locator) {
    this.name = root.toString();
  }

  get locator(): Locator {
    return this.root;
  }

  get page(): Page {
    return this.root.page();
  }

  protected chain(step: Step): this {
    this.steps.push(step);
    return this;
  }

  protected async flush(): Promise<void> {
    const steps = this.steps;
    this.steps = [];
    for (const step of steps) await step();
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.flush().then(onfulfilled, onrejected);
  }

  clickOn(options?: Parameters<Locator['click']>[0]): this {
    return this.chain(() => this.root.click(options));
  }

  doubleClickOn(options?: Parameters<Locator['dblclick']>[0]): this {
    return this.chain(() => this.root.dblclick(options));
  }

  rightClickOn(options?: Timeout): this {
    return this.chain(() => this.root.click({ ...options, button: 'right' }));
  }

  clickAndWaitForUrl(url: string | RegExp, options?: Timeout): this {
    return this.chain(() => Promise.all([this.page.waitForURL(url, options), this.root.click(options)]));
  }

  hoverOver(options?: Parameters<Locator['hover']>[0]): this {
    return this.chain(() => this.root.hover(options));
  }

  focus(options?: Timeout): this {
    return this.chain(() => this.root.focus(options));
  }

  press(key: string, options?: Timeout): this {
    return this.chain(() => this.root.press(key, options));
  }

  scrollIntoView(options?: Timeout): this {
    return this.chain(() => this.root.scrollIntoViewIfNeeded(options));
  }

  waitFor(state: WaitState = 'visible', options?: Timeout): this {
    return this.chain(() => this.root.waitFor({ state, ...options }));
  }

  async getText(): Promise<string> {
    await this.flush();
    return (await this.root.innerText()).trim();
  }

  async getAttribute(name: string): Promise<string | null> {
    await this.flush();
    return this.root.getAttribute(name);
  }

  async getCount(): Promise<number> {
    await this.flush();
    return this.root.count();
  }

  checkIsVisible(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be visible`).toBeVisible(options));
  }

  checkIsHidden(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be hidden`).toBeHidden(options));
  }

  checkIsEnabled(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be enabled`).toBeEnabled(options));
  }

  checkIsDisabled(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be disabled`).toBeDisabled(options));
  }

  checkIsAttached(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be attached`).toBeAttached(options));
  }

  checkIsFocused(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be focused`).toBeFocused(options));
  }

  checkHasText(text: string | RegExp | (string | RegExp)[], options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should have text ${String(text)}`).toHaveText(text, options));
  }

  checkContainsText(text: string | RegExp | (string | RegExp)[], options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should contain text ${String(text)}`).toContainText(text, options),
    );
  }

  checkHasAttribute(name: string, value: string | RegExp, options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should have attribute ${name}=${String(value)}`).toHaveAttribute(
        name,
        value,
        options,
      ),
    );
  }

  checkHasClass(className: string, options?: Timeout): this {
    return this.chain(() =>
      expect(this.root, `${this.name} should have class ${className}`).toContainClass(className, options),
    );
  }

  checkHasCount(count: number, options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should have count ${count}`).toHaveCount(count, options));
  }
}
