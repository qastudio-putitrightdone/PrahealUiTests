import { Page, test } from '@playwright/test';
import { ApiRouter } from '../api/ApiRouter';
import { User } from '../user/User';
import { LocalStorageKeys } from '../constants/LocalStorageKeys';

type LocalStorageState = {
  origin: string;
  sessionKey: string;
  items: Record<string, string>;
};

export class BrowserSession {
  constructor(
    private readonly page: Page,
    private readonly router: ApiRouter,
  ) {}

  async loginAs(user: User): Promise<void> {
    await test.step(`Authenticate ${user} via API and set local storage`, async () => {
      const api = this.router.user.getUser(user);
      const session = await api.auth.getSession();
      const permissions = await api.permission.getPermissions();
      const branches = await api.dropdown.getBranches();
      const branch = branches.branches.find((candidate) => candidate.isActive);

      if (!permissions.encryptedPermissions) {
        throw new Error(`Could not load permissions for ${user}: [${permissions.statusCode}] ${permissions.message}`);
      }
      if (!branch) {
        throw new Error(`No active branch available for ${user}: [${branches.statusCode}] ${branches.message}`);
      }

      await this.setLocalStorage({
        origin: new URL(test.info().project.use.baseURL ?? '').origin,
        sessionKey: LocalStorageKeys.LOGGED_IN_USER,
        items: {
          [LocalStorageKeys.LOGGED_IN_USER]: JSON.stringify(session.raw),
          [LocalStorageKeys.USER_PERMISSION]: permissions.encryptedPermissions,
          [LocalStorageKeys.SELECTED_BRANCH]: JSON.stringify(branch.id),
          [LocalStorageKeys.SELECTED_BRANCH_IS_ACTIVE]: JSON.stringify(branch.isActive),
          [LocalStorageKeys.LAST_ACTIVITY_TIMESTAMP]: String(Date.now()),
        },
      });
    });
  }

  private async setLocalStorage(state: LocalStorageState): Promise<void> {
    await this.page.context().addInitScript((seed: LocalStorageState) => {
      if (window.location.origin !== seed.origin || window.localStorage.getItem(seed.sessionKey)) {
        return;
      }
      for (const [key, value] of Object.entries(seed.items)) {
        window.localStorage.setItem(key, value);
      }
    }, state);
  }
}
