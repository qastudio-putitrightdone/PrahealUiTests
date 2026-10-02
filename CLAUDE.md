# PrahealUiTests

UI test automation framework for the Praheal application, built on Playwright + TypeScript with Allure reporting.
Application under test: `https://prahealqa.medojus.com` (configured as `baseURL`).

## Project layout

```
decorator/          Element decorators (Input, Button, Dropdown, Table, ...). All extend BaseElement.
pages/              Page classes - locators only. All extend BasePage.
actionsComponents/  Action classes - business flows + verifications. Each extends its page class.
fixtures/           index.ts: custom `test` with action classes, `router` and `browserSession` injected; makes the browser window fullscreen.
                    BrowserSession.ts: API login + local storage seeding for UI tests that skip the login screen.
reporting/allure.ts @Step decorator and Allure({...}) test metadata helper.
user/               User model (User.ts) and login credentials per role (Users.ts).
api/                API layer: core/ (client + handler chain) and one folder per application module.
constants/          Application constants: ApplicationMessages, ApplicationLabels (field names/labels used in assertions and test data), LocalStorageKeys.
tests/<feature>/    Spec files, e.g. tests/login/LoginTests.spec.ts.
```

Layering: **tests → actionsComponents → pages → decorator → Playwright**. Never skip a layer.

## Commands

```
npm test                  # run all tests (allure-results is cleared at the start of every run)
npx playwright test tests/login          # run one folder
npm run allure:generate   # rebuild allure-report/ from allure-results/ (old report is deleted first)
npm run allure:open       # open the report
npm run test:allure       # run + generate + open
npm run test:smoke        # run only tests tagged @smoke
npx playwright test --grep "@APT-03|@PAY-01"   # run tests by scenario ID
npm run -s zephyr -- list            # list Zephyr Scale test cases (project HAT)
npm run -s zephyr -- get HAT-T12     # show a Zephyr test case with steps
npx -y -p typescript tsc -p tsconfig.json   # type-check (typescript is not a dependency)
```

Always type-check after changes. Do not run tests against the QA application unless asked.

## Automating new tests

Use the `/automate-test` skill (`.claude/skills/automate-test/SKILL.md`) to turn a described test case into code. It explores the live app with the Playwright MCP server configured in `.mcp.json`, proves every locator by driving the app with it, adds missing decorators/methods, and writes page, actions and spec code following the rules below.

## Zephyr Scale and secrets

- Manual test cases live in Zephyr Scale (Jira project `HAT`). Use the `/automate-zephyr-test <KEY>` skill to fetch a test case, review it against the application context and automate it via `/automate-test`. Manual tests have a Preconditions part (automated through the API) and UI steps (the scenario under test, automated through the UI); test cases with unclear or ambiguous preconditions or UI steps are not automated - the skill returns corrections for the Zephyr test case instead. Automated Zephyr tests carry their test case ID as Allure TMS link: `Allure({ ..., tmsLink: 'HAT-T12' })` (equivalent of Java's `@TmsLink`); the report links to the Zephyr test case (URL template in `playwright.config.ts`) and the key is also added as a `@HAT-T12` tag for `--grep`.
- `scripts/zephyr.mjs` is the Zephyr Scale API client run via `npm run -s zephyr -- ...` (loads `.env` with `node --env-file`): `list` (filters `--folder`, `--status`, `--label`, `--search`), `get`, `create --file <json>` and `mark-automated <KEY> --spec <path> --title <title>` (both support `--dry-run`).
- **Every automated test maps to a Zephyr manual test case** (one verification point each): use the given key, else find one (`list --label <SCENARIO-ID>` / `--search`), else create it. Link both ways: `tmsLink` in the spec, `mark-automated` in Zephyr (label `automated`, web link to the spec when `AUTOMATION_REPO_URL` is set). Existing Zephyr test case text is never edited by automation.
- **Zephyr folders mirror the `tests/` directory structure**: `tests/login/...` -> folder `login`, `tests/dashboard/...` -> `dashboard`, `tests/api/auth/...` -> `api/auth` (nested folders are created by the client).
- When asked to automate a single test, do not suggest missing scenarios; list missing tests for a functionality only when explicitly asked (`/praheal-test-advisor gaps`).
- **Secrets live only in the gitignored `.env`** (`ZEPHYR_API_TOKEN`, ...); `.env.example` lists the variables without values. Never put tokens or passwords for external systems in `.mcp.json`, code, docs or output. If an MCP server needs a secret, reference it as `${VAR}` in `.mcp.json` and keep the value in the environment.

## Application context and test planning

The Praheal application context (built from `Praheal_User_Manual_24_09.pdf` at the project root) lives in `.claude/skills/praheal-test-advisor/context/`: overview and roles, modules with numbered business rules, the scenario catalog (IDs, priorities, smoke flags), the dependency / defect impact map and open questions. Use the `/praheal-test-advisor` skill to find missing scenarios (`gaps`), review the smoke suite (`smoke`) and get sanity / regression areas for a defect (`defect <description>`). Never assert a rule marked (?) - it is contradicted in the manual (`05-open-questions.md`).

## General rules

- **No hardcoded application values outside locators.** Application messages, field names/labels used in assertions or test data, local storage keys and API values come from constants. **Locators are not constants** - selectors stay as literal strings in page classes (`this.input('input[placeholder="Mobile No."]')`, `this.text('Patients', { selector: 'h6.title' })`).
  - `constants/ApplicationLabels.ts` - field names/labels the app shows, when used in assertions or test data (never inside selectors).
  - `constants/ApplicationMessages.ts` - messages the app shows (UI or API), used in assertions.
  - `constants/LocalStorageKeys.ts` - browser storage keys.
  - `api/core/ApiConstants.ts` - API values (base path, default country code, login module, dropdown module names). Endpoint paths stay in each module's `<Module>Endpoint` enum; status codes in `ApiStatus`.
  - Add a new constant before using a new value; reuse existing ones. Locators (everything passed to the page-class factories), page URLs (`readonly` fields on page classes) and user credentials (`user/Users.ts`) live outside these files.
- Do not add code comments.
- Match existing naming and style; keep files small and focused.

## Decorators (`decorator/`)

- Every element type is a class in `decorator/` extending `BaseElement`, exported from `decorator/index.ts`.
- Common actions/assertions belong in `BaseElement`; element-specific ones in the subclass.
- **One method = exactly one action or exactly one assertion.** Never combine two assertions, or an assertion and an action, in one method (e.g. no `checkIsClickable` doing visible + enabled; chain `checkIsVisible().checkIsEnabled()` instead).
- No conditional logic and no boolean-returning state methods (no `if (isVisible)`, no `clickIfEnabled`). State is verified with assertions only.
- **Actions and assertions are chainable**: they return `this` and are queued with `this.chain(() => ...)`. Awaiting the element runs the queue in order:
  ```ts
  await this.mobileField.checkIsVisible().clear().fill(mobile).checkHasValue(mobile);
  ```
  A chain must always be awaited, otherwise nothing runs.
- **Assertions** always use Playwright `expect` (web-first, auto-retrying), are prefixed `check` (`checkIsVisible`, `checkIsEnabled`, `checkHasText`, `checkContainsText`, `checkHasValue`, ...), and pass a message using `this.name`:
  ```ts
  checkIsEnabled(options?: Timeout): this {
    return this.chain(() => expect(this.root, `${this.name} should be enabled`).toBeEnabled(options));
  }
  ```
- **Getters** that return data are prefixed `get` (`getText`, `getValue`, `getCellText`, ...), are `async`, and call `await this.flush()` first so pending chained steps run before reading.
- Every method accepts an optional `options?: Timeout` (or the matching Playwright options type) as its last parameter.
- Decorators never take a display name; `this.name` is derived from the locator.

## Pages (`pages/`)

- Page classes hold **locators only** - no actions, no assertions, no `page.locator()` calls.
- Extend `BasePage` and create elements with its factories: `this.input()`, `this.button()`, `this.checkbox()`, `this.radio()`, `this.dropdown()`, `this.customDropdown()`, `this.errorMessage()`, `this.link()`, `this.table()`, `this.text()`, `this.element()`. They accept a selector string or a Locator (e.g. `page.getByRole(...)`).
- Declare elements as `protected readonly` typed fields and assign them in the constructor:
  ```ts
  protected readonly mobileField: Input;

  constructor(page: Page) {
    super(page);
    this.mobileField = this.input('input[placeholder="Mobile No."]');
  }
  ```
- Page URLs are `readonly` fields on the page class (relative to `baseURL`).
- New element types: add a decorator class + a factory method in `BasePage`.

## Actions (`actionsComponents/`)

- One actions class per page, `<Name>Actions extends <Name>Page`, using the page's protected elements.
- **Every method has `@Step('...')`** with a descriptive, human-readable name (from `reporting/allure.ts`):
  ```ts
  @Step('Enter mobile number "{0}"')
  private async enterMobileNumber(mobileNumber: string) { ... }
  ```
  `{0}`, `{1}` are replaced with method arguments. **Never put passwords or secrets in step names.**
- Verification methods are named `check...` (e.g. `checkLoginButtonDisplayed`). Any `@Step` method whose name starts with `check` automatically attaches a screenshot to the Allure step (pass or fail).
- Low-level steps may be `private`; compose them into public business flows (e.g. `loginToApplication`), which show as nested steps in the report.
- Register every new actions class as a fixture in `fixtures/index.ts`.

## API layer (`api/`)

- Base path `/backend/api/` on `baseURL`. Requests are `multipart/form-data`. **HTTP status is always 200** - the real result is `status_code` in the body (`api/core/ApiStatus.ts`: `SUCCESS` 1, `INVALID_CREDENTIALS` 101, `UNAUTHORIZED` 401, `LOGGED_IN_ELSEWHERE` 10010). Assert on `statusCode`, never on HTTP status.
- Every request goes through a **Chain of Responsibility** built in `api/core/ApiClient.ts`: `ReportingHandler` (Allure step `API <METHOD> <endpoint>`) -> `AuthenticationHandler` (adds `Authorization: Bearer <token>` when `authenticated: true`; on 401/10010 logs in again and retries once) -> `SendRequestHandler`. Cross-cutting concerns (retry, logging, headers) are new `ApiHandler` subclasses inserted into the chain - never added to module services.
- **Entry point is the `router` fixture** (`api/ApiRouter.ts`): `const user = router.user.getUser(SUPER_ADMIN)` returns a `UserApi` (`api/UserApi.ts`) exposing every module service for that user - `user.auth.login(...)`, `user.permission.getPermissions()`. One `ApiClient` per user is created lazily and reused; it logs in on the first authenticated call and caches the token. Tests never construct `ApiClient` or module services directly. The app allows one session per user, so parallel logins as the same user can invalidate tokens - the re-auth handler covers API calls.
- One folder per module: `api/<module>/` with
  - `<Module>Endpoint.ts` - `enum <Module>Endpoint` holding every endpoint path of the module (e.g. `AuthEndpoint.LOGIN = 'login/checkLogin'`). Services never hardcode paths.
  - `<Module>Api.ts` - service (facade) with one method per endpoint; builds an `ApiRequest` using the endpoint enum, calls `client.send()`, returns a response record. Register it as a `readonly` property in `api/UserApi.ts`.
  - `payload/<Name>Payload.ts` - `type <Name>Payload = Readonly<{...}>` with API (snake_case) field names, plus `<Name>PayloadBuilder` with `withX()` / helper setters returning `this`, sensible defaults, and `build()` that validates required fields and returns `Object.freeze({...})`.
  - `response/<Name>Response.ts` - immutable record classes: `private constructor` with `readonly` camelCase fields, `Object.freeze(this)`, `static from(raw)` mapping the snake_case JSON; nested objects and arrays are records/frozen too.
- `payload/` holds builders for endpoints that send data; GET endpoints without parameters have none (folder kept with `.gitkeep`).
- API specs live in `tests/api/<module>/`, use the `router` fixture and may assert on response records with `expect`.

## Logged-in UI tests without the login screen (`fixtures/BrowserSession.ts`)

- Tests that are not about login must not log in through the UI. In `beforeEach` call `await browserSession.loginAs(SUPER_ADMIN)` and then open the page (e.g. `await dashboardActions.openAdminPage()`).
- `BrowserSession.loginAs(user)` uses the router to get the user's API session (`auth.getSession()`), permissions and branches, and registers an init script that fills local storage before the app loads: `PRAHEAL` (raw login data), `user_permission`, `selectedBranch`, `selectedBranchIsActive`, `lastActivityTimestamp`. No cookie is needed.
- The browser and the API client share **one login** (`ApiClient.getSession()`), because the app allows one session per user - never call `auth.login()` for a user whose session the browser uses.
- If the app starts storing new keys after login, add them in `BrowserSession`.

## Users and credentials (`user/`)

- `user/User.ts` is the model (`role`, `mobileNumber`, `password`); `toString()` returns the role, so `@Step('... as {0}')` shows the role, never the password.
- All login credentials live in `user/Users.ts` as `static readonly` `User` constants (`SUPER_ADMIN`, `MEDICAL_DIRECTOR`, `CONSULTANT`, `RECEPTIONIST`), also exported by name. Never hardcode mobile numbers or passwords in specs or actions.
- Log in by passing a user: `await loginActions.loginToApplication(SUPER_ADMIN);`
- New role: add a constant to `Users` and to the named export.

## Tests (`tests/`)

- **Always import `test` (and `expect`) from `fixtures`**, never from `@playwright/test`, otherwise action fixtures are unavailable.
- Tests only call action-class methods. No locators, no element access, no direct `expect` on elements in specs.
- **One test = one verification point**: a test may perform several actions but ends with exactly one `check...` call, so a failure points to one broken behaviour. Several expected outcomes -> several tests sharing setup.
- **Preconditions (data the scenario needs) are created through the API** in `beforeEach` or a fixture via the `router` fixture, with unique test data per run and a `statusCode === ApiStatus.SUCCESS` check; only the steps under test use the UI. Never depend on records created by other tests or manually.
- Allure metadata uses `Allure({...})` from `reporting/allure.ts` (`epic`, `feature`, `story`, `severity`, `description`):
  - `epic` / `story` shared by a group go on `test.describe`.
  - `description` goes on **each test**.
  - `tags` on each test: its scenario ID from the catalog plus `smoke` if the scenario is flagged `S` (`tags: ['smoke', 'DSH-01']`). Tags become Playwright `@tags` (filter with `--grep`) and Allure tag labels.
  - `tmsLink` on each test automated from Zephyr: the Zephyr test case ID (`tmsLink: 'HAT-T12'`, or an array for several). Do not also put the key in `tags`.
  ```ts
  test.describe('Login screen verifications', Allure({ epic: 'Authentication', story: 'Login screen' }), () => {
    test.beforeEach(async ({ loginActions }) => {
      await loginActions.open();
    });

    test('login screen displays mobile number field', Allure({
      description: 'Verifies the mobile number field is visible on the staff login page',
    }), async ({ loginActions }) => {
      await loginActions.checkMobileNoTextFieldDisplayed();
    });
  });
  ```

## Configuration notes

- Tests run **one at a time**: `workers: 1` and `fullyParallel: false` in `playwright.config.ts` (the app allows one session per user, so parallel tests with the same user interfere). Do not raise it without separate test users per worker.
- Runs in Google Chrome (`channel: 'chrome'`), headed, with `viewport: null`. Fullscreen is applied per test in the `page` fixture via CDP (`Browser.setWindowBounds`); `--start-fullscreen`/`--start-maximized` launch flags do not work with Playwright contexts.
- Allure reporter runs with `detail: false` so only `@Step` steps appear (Playwright's built-in steps would expose typed passwords).
- `expect` timeout is 15s.
- `reporting/global-setup.ts` (Playwright `globalSetup`) deletes `allure-results/` once per run, so results never mix across runs regardless of how tests are started (npm, npx, IDE). Do not clear it in `playwright.config.ts` itself - the config is loaded by every worker.
- `@Step` uses TypeScript standard (TC39) decorators - do not enable `experimentalDecorators`.
