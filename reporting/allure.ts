import { test, TestDetails, TestDetailsAnnotation } from '@playwright/test';
import type { BasePage } from '../pages/BasePage';

export interface AllureMetadata {
  epic?: string;
  feature?: string;
  story?: string;
  severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
  description?: string;
  tags?: string[];
  tmsLink?: string | string[];
}

export function Allure({ tags = [], tmsLink = [], ...labels }: AllureMetadata): TestDetails {
  const tmsLinks = typeof tmsLink === 'string' ? [tmsLink] : tmsLink;
  const annotation: TestDetailsAnnotation[] = [
    ...Object.entries(labels).map(([key, value]) => ({
      type: key === 'description' ? 'description' : `allure.label.${key}`,
      description: value,
    })),
    ...tmsLinks.map((key) => ({ type: 'tms', description: key })),
  ];
  return { annotation, tag: [...tags, ...tmsLinks].map((tag) => `@${tag}`) };
}

const humanize = (methodName: string): string => {
  const words = methodName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const formatName = (template: string, args: unknown[]): string =>
  template.replace(/\{(\d+)\}/g, (match, index: string) => (index in args ? String(args[Number(index)]) : match));

export function Step(name?: string) {
  return function <This extends BasePage, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    const methodName = String(context.name);
    const isCheck = methodName.startsWith('check');

    return async function (this: This, ...args: Args): Promise<Return> {
      const stepName = name ? formatName(name, args) : humanize(methodName);
      return test.step(stepName, async () => {
        try {
          return await target.call(this, ...args);
        } finally {
          if (isCheck) {
            await test.info().attach(stepName, { body: await this.takeScreenshot(), contentType: 'image/png' });
          }
        }
      });
    };
  };
}
