---
name: automate-test
description: Automate a manually described test case for the Praheal application. Explores the live app with Playwright MCP, builds stable decorator-based locators, adds missing decorators/methods, writes page + actions + spec code following the framework rules, and runs the new test. Use when the user describes a test case/scenario to automate.
argument-hint: <test case description, steps and expected results>
---

# Automate a test case with Playwright MCP

The user describes a test case (steps + expected results). Turn it into framework code that passes, by **exploring the real application first** and **writing code second**. Never guess locators.

Test case to automate:

$ARGUMENTS

## Scope

- **Automate only what was asked.** When the user asks to automate a single test, do not suggest missing or additional test scenarios for that functionality - other test cases may already be in drafting. Improvements to the requested test itself (clearer steps, concrete data, stronger expected result) are welcome.
- Only when the user explicitly asks for missing tests, highlight the missing tests for that functionality (see `/praheal-test-advisor gaps`).
- **One test = one verification point.** Each automated test proves exactly one expected outcome, so a failure points to exactly one broken behaviour. The test may contain several actions (they set up the state), but only **one** `check...` call - the verification point - at the end. If the test case describes several expected outcomes, each one is a separate test (same preconditions, own verification). Expected results of intermediate steps (e.g. "the number is shown in the field") are not separate verifications.

## 0. Prepare

1. Read `CLAUDE.md` - all framework rules there are mandatory. Re-read it if unsure; do not rely on memory.
2. Read the existing code you may reuse: `decorator/` (all element types and their methods), `pages/`, `actionsComponents/`, `fixtures/index.ts`, and the `tests/` folder for the feature.
3. Get `baseURL` from `playwright.config.ts`.
   Read the application context in `.claude/skills/praheal-test-advisor/context/`: find the module and business rules (`02-modules-and-rules.md`) the test case touches, the matching scenario ID in `03-test-scenarios.md` (or the next free ID if it is new), and check `05-open-questions.md` - if the expected result depends on a contradicted (?) rule, ask the user before automating.
4. Decide whether login is the functionality under test - see **Login policy** below.
5. If the test case is missing anything you need (start page, test data, expected result), ask the user before starting. If it needs to log in, use the matching user from `user/Users.ts` (`SUPER_ADMIN`, `MEDICAL_DIRECTOR`, `CONSULTANT`, `RECEPTIONIST`); if that user has empty credentials or the role is missing, ask the user for them and add them to `Users.ts`.
6. Confirm the Playwright MCP tools (`browser_navigate`, `browser_snapshot`, ...) are available. If not, tell the user to approve the `playwright` server from `.mcp.json` (run `/mcp`) and stop.

## Login policy

**If login is not the functionality under test, the test must not log in through the UI.** Logging in through the login screen in every test is slow, and if the login page breaks, it makes unrelated tests fail too.

- **Login is NOT under test** (dashboard, patients, appointments, settings, ...): the spec's `beforeEach` calls `await browserSession.loginAs(<USER>)` and then the actions method that opens the start page directly by URL, e.g.
  ```ts
  test.beforeEach(async ({ browserSession, dashboardActions }) => {
      await browserSession.loginAs(SUPER_ADMIN);
      await dashboardActions.openAdminPage();
  });
  ```
  `browserSession.loginAs()` (`fixtures/BrowserSession.ts`) authenticates through the API and sets local storage before the app loads - this is the faster and preferred way to start a logged-in test. Never call `loginActions.loginToApplication()` or open `/staff-login` in these tests.
- **Login IS under test** (login form, validation messages, wrong password, logout, ...): use `loginActions` and the login screen as normal.
- **Which user:** the role named in the test case, as a constant from `user/Users.ts` (`SUPER_ADMIN`, `MEDICAL_DIRECTOR`, `CONSULTANT`, `RECEPTIONIST`). If no role is stated, ask. If the role's credentials are empty or the role is missing, ask for them and add them to `Users.ts`.
- **Start page:** if the page you need has no `open...()` method yet, add a `readonly` URL field to its page class and an `@Step('Open the ... page') open...()` method to its actions class that calls `this.page.goto(url)`.
- **MCP exploration** is the one exception: there you may log in through the UI to reach the page, because the MCP browser has no API session. This never goes into the test code.

## 1. Launch the application

- `browser_navigate` to `baseURL` + `/staff-login`, log in through the UI as the test case's user (exploration only - see Login policy), then `browser_navigate` to the start page of the test case. If login is the functionality under test, start at `/staff-login` and stay there.
- `browser_snapshot` to see the page.

## 2. Walk through the test case, one step at a time

For **every** step in the description:

1. `browser_snapshot` (or `browser_find` with the element's text to save tokens) to locate the element.
2. Choose a locator using the priority below and **perform the step through MCP using that exact selector** as `target` (`browser_click`, `browser_type`, `browser_select_option`, `browser_hover`, `browser_press_key`, ...). MCP rejects selectors that match zero or several elements, so a successful action proves the locator is unique and works. If it fails, pick a better locator - never fall back to the snapshot `ref` for code.
3. After the action, `browser_snapshot` again to confirm the expected result and to discover the next element. Use `browser_wait_for` for loading states.
4. Record for each step: the element, its decorator type, the final selector, the action/assertion, and test data used.

For expected results ("should show", "should be displayed", "error appears", ...), verify them on the page via snapshot and record the element + the assertion to use.

### Constants - no hardcoding

Never hardcode application values in actions, decorators, API classes or specs. **Locators are the exception: constants are not for locators** - selectors stay as literal strings in page classes, exactly as verified during exploration. Use constants for:

- Field names/labels the app shows, when used in assertions or as test data -> `constants/ApplicationLabels.ts` (never inside selectors).
- Messages the app shows (errors, toasts, validation, API `message`) -> `constants/ApplicationMessages.ts`, used in assertions, e.g. `checkContainsMessage(ApplicationMessages.INVALID_CREDENTIALS)`.
- Browser storage keys -> `constants/LocalStorageKeys.ts`.
- API values (country code, module names, base path) -> `api/core/ApiConstants.ts`; endpoint paths -> `<Module>Endpoint` enum; status codes -> `ApiStatus`.
- Reuse an existing constant when the value already exists; otherwise add one with an UPPER_SNAKE_CASE name describing the value. Locators, page URL fields and `user/Users.ts` credentials stay outside the constants files.

### Locator priority

Use the first option that is unique and stable:

1. `#id` or `[data-testid="..."]` / `[data-test="..."]` / `[name="..."]` - skip ids that look generated (`#mat-input-3`, `#react-select-12`, random hashes).
2. Semantic attributes: `input[placeholder="Mobile No."]`, `button[title="Login"]`, `[aria-label="Close"]`, `a[href="/forgot-password"]`.
3. Role-based locators passed as a Locator to the factory: `this.button(page.getByRole('button', { name: 'Login' }))`. Verify these with `browser_run_code_unsafe` (`async (page) => page.getByRole(...).count()` must return 1), since MCP `target` takes CSS/text selectors.
4. Text scoped to a stable container: `.login-card >> text=Forgot password`.

Never use: `nth`/index-based selectors, absolute XPath, long CSS chains, utility/generated class names (`.css-1x2y3z`, `.sc-abc`, `.mt-4.flex`), or text that changes per run (dates, ids, counts).

Prefer the same selector style already used in the page class you are extending.

## 3. Map elements to decorators

| Element | Decorator | Factory |
|---|---|---|
| text input / textarea | `Input` | `this.input()` |
| button / clickable icon | `Button` | `this.button()` |
| native `<select>` | `Dropdown` | `this.dropdown()` |
| custom (div) dropdown | `CustomDropdown` | `this.customDropdown()` |
| checkbox / switch | `Checkbox` | `this.checkbox()` |
| radio | `RadioButton` | `this.radio()` |
| link | `Link` | `this.link()` |
| table / grid | `Table` | `this.table()` |
| error/alert box with close button | `ErrorMessage` | `this.errorMessage()` |
| element identified by its visible text (heading, title, label) | `TextElement` | `this.text('Patients', { selector: 'h6.title' })` |
| anything else | `BaseElement` | `this.element()` |

### Missing decorator or method

- **Missing method** (e.g. the step needs `checkIsReadOnly` on a type that lacks it): add it to the most specific decorator that owns the behaviour - `BaseElement` only if it applies to every element type.
- **Missing element type** (e.g. date picker, modal, toast, tabs, file upload): create `decorator/<Name>.ts` extending `BaseElement`, export it from `decorator/index.ts`, and add a `protected <name>()` factory to `pages/BasePage.ts`. Nested parts (e.g. a modal's close button) are built inside the constructor as other decorators scoped to `root`, like `ErrorMessage`.
- New methods follow the decorator rules in `CLAUDE.md` exactly: one action **or** one assertion per method, chainable via `this.chain(...)` returning `this`, assertions named `check...` using `expect` with a `${this.name} should ...` message, getters named `get...` that `await this.flush()` first, optional `options?: Timeout` last, no conditionals, no comments.

## 4. Write the code

Work out which feature/page the test belongs to and reuse existing files whenever they fit.

1. **Page class** - `pages/<Name>Page.ts`: add the new elements as `protected readonly` typed fields, assigned in the constructor via factories. Locators only. Selectors are literal strings exactly as verified with MCP (e.g. `this.input('input[placeholder="Mobile No."]')`, `this.text('Patients', { selector: 'h6.title' })`) - never build them from constants or template strings. Create the page class if the screen has none (extend `BasePage`, add a `readonly` URL field if the page is directly navigable).
2. **Actions class** - `actionsComponents/<Name>Actions.ts` (`extends <Name>Page`):
   - Reuse existing methods; add only what is missing.
   - Each method gets `@Step('...')` with a clear human-readable name; use `{0}`, `{1}` for arguments; never put passwords/secrets in step names.
   - Verifications are methods named `check...` (they get automatic screenshots).
   - Compose low-level `private` steps into public business methods.
   - If a new actions class is created, register it in `fixtures/index.ts`.
3. **Spec** - `tests/<feature>/<Feature>Tests.spec.ts`:
   - Add to the existing spec for that feature; create one only if none exists.
   - Import `test` from `fixtures` and `Allure` from `reporting/allure`.
   - `epic` / `story` go on the `test.describe` (reuse the existing block when they match); if the story differs, put `story` on the test itself.
   - **Allure metadata on every test** (all three mandatory - the PR check rejects tests without them): `requirement` = the scenario / requirement ID from the catalog (`requirement: 'AUTH-02'`; if the scenario is new, add it to `03-test-scenarios.md` with the next free ID), `tmsLink` = the Zephyr test case ID (step 6), `description`. Add `tags: ['smoke']` when the scenario is flagged `S`; never put requirement IDs or Zephyr keys in `tags`.
   - `tmsLink` is the equivalent of Java's `@TmsLink`: `Allure({ description: '...', tags: ['smoke'], requirement: 'APT-03', tmsLink: 'HAT-T12' })`. It renders the Zephyr link in Allure (named with the test case ID, which the Allure Dashboard traceability matrix uses) and adds the `@HAT-T12` tag automatically.
   - **Every test has `Allure({ description: '...' })`** - a full sentence describing the one thing verified and the expected outcome, e.g. `'Verifies that logging in with a wrong password shows the error message "Invalid Mobile No. Or Password."'`.
   - Test title is short and behaviour-focused (`'shows error for invalid password'`), not a step list.
   - The test body only calls actions-class methods - no locators, no element access, no direct `expect`.
   - **Exactly one verification point per test**: one `check...` actions call, as the last statement. A `check...` method verifies one outcome (it may chain assertions on the same element, e.g. `checkIsVisible().checkContainsMessage(message)` for one message). Several outcomes -> several tests, sharing setup through `beforeEach` or a reusable actions method.
   - **Preconditions are created through the API, never through the UI**: in `beforeEach` (or a fixture) use the `router` fixture (`router.user.getUser(<USER>).<module>.<method>()`) to create the data the scenario needs, with unique values per run, and check each response is `ApiStatus.SUCCESS`. The UI steps start from that state. If an endpoint is missing, find it by performing the action once in the MCP browser and reading `browser_network_requests`, then add it to the API layer per CLAUDE.md. When the test case is given with explicit precondition API calls (e.g. from `/automate-zephyr-test`), use exactly those.
   - Follow the **Login policy**: when login is not under test, `beforeEach` uses `browserSession.loginAs(<USER>)` + an `open...()` actions method; `loginActions.loginToApplication(<USER>)` is used only when login itself is being tested. Users always come from `user/Users.ts` - never hardcode mobile numbers or passwords in specs or actions. Other test data may be inline.

## 5. Verify

1. Type-check and framework rule check: `npm run typecheck` and `npm run lint` - fix all errors (the same checks run on every pull request).
   Then confirm the spec follows the Login policy: no `loginToApplication` or `/staff-login` in a test that is not about login.
   Also confirm there are no hardcoded application messages, labels, storage keys or API values outside locators in the code you added - each must come from a constants file. Locators must stay literal selectors.
2. Close the MCP browser (`browser_close`), then run only the new test: `npx playwright test tests/<feature>/<File>.spec.ts -g "<test title>"`.
3. If it fails, read the error, re-check the page with MCP if needed, fix, and re-run. Do not weaken assertions or add fixed waits (`waitForTimeout`) to make it pass.
4. Repeat until it passes. If it cannot pass because the application behaves differently from the described expected result, stop and report it as a possible defect instead of changing the expectation.

## 6. Map the test to a Zephyr manual test case

Every automated test must be traceable to a manual test case in Zephyr Scale (project HAT), via the read-only-by-default client `npm run -s zephyr -- ...` (token in `.env`; never print it).

1. **Test came from Zephyr** (a `tmsLink` key was given): use that key.
2. **Otherwise find an existing manual test**: `npm run -s zephyr -- list --label <SCENARIO-ID>` and `npm run -s zephyr -- list --search "<key words>"`; use it if it describes the same single verification point.
3. **None exists - create it** from the automated test (one Zephyr test case per automated test, same single verification point):
   - Write a JSON file in the scratchpad: `name` (behaviour-focused, e.g. "Verify error message for invalid password of Super Admin"), `objective`, `precondition` (user / role, branch, data created through the API, start page), `priority` (P1 -> High, P2 -> Normal, P3 -> Low), `status` `Draft`, `folder` = **the spec's directory relative to `tests/`, mirroring this repository's structure** (`tests/login/LoginTests.spec.ts` -> `login`, `tests/dashboard/AdminDashboardTests.spec.ts` -> `dashboard`, `tests/api/auth/...` -> `api/auth`; the client finds or creates nested folders), `labels` (scenario ID + `smoke` if applicable), `steps` (action, test data, expected result - only the last step carries the verification point; intermediate steps state what happens). Never put passwords or tokens in it - refer to the user role ("Super Admin password").
   - Check it with `npm run -s zephyr -- create --file <file> --dry-run`, then create it with the same command without `--dry-run`. Note the returned key.
4. **Link both ways**:
   - Spec: `tmsLink: '<KEY>'` in the test's `Allure({...})`.
   - Zephyr: `npm run -s zephyr -- mark-automated <KEY> --spec <spec path> --title "<test title>"` (adds the `automated` label, and a web link to the spec when `AUTOMATION_REPO_URL` is set in `.env`).
5. Never edit the steps or text of an existing Zephyr test case - only create missing ones and mark automated ones.

## 7. Report back

Summarise briefly:
- Test added (file + title) and its description.
- Page/actions methods added or reused.
- Decorators or decorator methods added (if any).
- Constants added (if any).
- Users added to `user/Users.ts` (if any).
- Scenario ID(s) covered, and whether the catalog was updated.
- Zephyr test case key, whether it was found or created, and that it is marked automated.
- Test run result.
