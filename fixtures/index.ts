import { test as base } from '@playwright/test';
import { LoginActions } from '../actionsComponents/LoginActions';
import { DashboardActions } from '../actionsComponents/DashboardActions';
import { ApiRouter } from '../api/ApiRouter';
import { BrowserSession } from './BrowserSession';

type Actions = {
  loginActions: LoginActions;
  dashboardActions: DashboardActions;
  router: ApiRouter;
  browserSession: BrowserSession;
};

export const test = base.extend<Actions>({
  page: async ({ page, browserName }, use) => {
    if (browserName === 'chromium') {
      const cdp = await page.context().newCDPSession(page);
      const { windowId } = await cdp.send('Browser.getWindowForTarget');
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'fullscreen' } });
      await cdp.detach();
    }
    await use(page);
  },
  loginActions: async ({ page }, use) => {
    await use(new LoginActions(page));
  },
  dashboardActions: async ({ page }, use) => {
    await use(new DashboardActions(page));
  },
  router: async ({ request }, use) => {
    await use(new ApiRouter(request));
  },
  browserSession: async ({ page, router }, use) => {
    await use(new BrowserSession(page, router));
  },
});

export { expect } from '@playwright/test';
