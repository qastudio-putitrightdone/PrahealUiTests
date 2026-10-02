import { Locator, Page } from '@playwright/test';
import {
  BaseElement,
  Button,
  Checkbox,
  CustomDropdown,
  Dropdown,
  ErrorMessage,
  Input,
  Link,
  RadioButton,
  Table,
  TableOptions,
  TextElement,
  TextElementOptions,
} from '../decorator';

export type Target = string | Locator;

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async takeScreenshot(): Promise<Buffer> {
    return this.page.screenshot();
  }

  private resolve(target: Target): Locator {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }

  protected element(target: Target): BaseElement {
    return new BaseElement(this.resolve(target));
  }

  protected input(target: Target): Input {
    return new Input(this.resolve(target));
  }

  protected button(target: Target): Button {
    return new Button(this.resolve(target));
  }

  protected checkbox(target: Target): Checkbox {
    return new Checkbox(this.resolve(target));
  }

  protected radio(target: Target): RadioButton {
    return new RadioButton(this.resolve(target));
  }

  protected dropdown(target: Target): Dropdown {
    return new Dropdown(this.resolve(target));
  }

  protected customDropdown(target: Target, optionSelector?: string): CustomDropdown {
    return new CustomDropdown(this.resolve(target), optionSelector);
  }

  protected errorMessage(target: Target, closeButtonSelector?: string): ErrorMessage {
    return new ErrorMessage(this.resolve(target), closeButtonSelector);
  }

  protected link(target: Target): Link {
    return new Link(this.resolve(target));
  }

  protected table(target: Target, options?: TableOptions): Table {
    return new Table(this.resolve(target), options);
  }

  protected text(text: string | RegExp, options?: TextElementOptions): TextElement {
    return new TextElement(this.page, text, options);
  }
}
