# Praheal UI Tests

End-to-end test automation for **Praheal**, a multi-tenant clinic management system. Built with Playwright and TypeScript, with Allure reporting, Zephyr Scale traceability and framework-rule checks on every pull request.

- Application under test (QA): `https://prahealqa.medojus.com`
- Test management: Zephyr Scale, Jira project `HAT`
- Reports: Allure Dashboard + Traceability Matrix on GitHub Pages

## Getting started

Requirements: Node.js 24, Google Chrome.

```bash
npm ci
npx playwright install chrome
cp .env.example .env          # only needed for the Zephyr client
```

`.env` holds local secrets (Zephyr API token) and is git-ignored. Never commit tokens or put them in `.mcp.json`.

## Running tests

Tests run **one at a time** (`workers: 1`): the application allows only one active session per user, so parallel tests with the same user would log each other out.

```bash
npm test                                         # all tests
npm run test:smoke                               # tests tagged @smoke
npx playwright test --grep "@HAT-T2|@HAT-T3"     # by Zephyr test case id
npx playwright test LoginTests                   # by spec file / class name
npx playwright test tests/login -g "invalid"     # by folder and title
```

Locally the browser opens headed and fullscreen. When `CI` is set, tests run headless at 1920x1080.

### Reports

```bash
npm run test:allure        # run tests, generate and open the Allure report
npm run allure:generate    # build allure-report/ from allure-results/
npm run allure:open
```

`allure-results/` is cleared at the start of every run.

## Project structure

```
decorator/           Element decorators (Input, Button, Dropdown, Table, ErrorMessage, TextElement, ...)
pages/               Page classes - locators only (BasePage factories)
actionsComponents/   Actions classes - business steps (@Step) and verifications (check...)
fixtures/            Custom `test` with actions, `router` and `browserSession` fixtures
api/                 API layer: core client (chain of responsibility) + one folder per module
constants/           Application messages, labels, local storage keys
reporting/           Allure helpers (@Step decorator, Allure({...}) metadata) and global setup
user/                Test users and credentials per role
scripts/             Zephyr Scale client, requirements CSV generator
lint/                Custom ESLint framework rules and GitHub annotation formatter
tests/<feature>/     Spec files
.claude/skills/      Claude Code skills and the Praheal application context
```

The layers are strictly ordered: **tests -> actions -> pages -> decorators -> Playwright**.

## Writing a test

```ts
import { test } from '../../fixtures';
import { Allure } from '../../reporting/allure';
import { SUPER_ADMIN } from '../../user/Users';

test.describe('Admin dashboard sections', Allure({ epic: 'Dashboard', story: 'Super Admin dashboard' }), () => {

    test.beforeEach(async ({ browserSession, dashboardActions }) => {
        await browserSession.loginAs(SUPER_ADMIN);
        await dashboardActions.openAdminPage();
    });

    test('displays Patients section to super admin', Allure({
        description: 'Verifies that a Super Admin sees the Patients section on the admin dashboard',
        tags: ['smoke'],
        requirement: 'DSH-01',
        tmsLink: 'HAT-T8',
    }), async ({ dashboardActions }) => {
        await dashboardActions.checkPatientsSectionDisplayed();
    })
})
```

Key rules (full list in [`CLAUDE.md`](CLAUDE.md)):

- **Allure metadata is mandatory**: `description`, `requirement` (requirement / scenario id, Allure label `requirement`) and `tmsLink` (Zephyr test case id). `tags` are only for run groups such as `smoke`.
- **One test = one verification point**: several actions, exactly one `check...` call at the end.
- **Specs call actions only** - no locators, no `expect`, no `page`.
- **No UI login unless login is under test** - use `browserSession.loginAs(USER)`, which authenticates through the API and prepares local storage.
- **Preconditions through the API** (`router.user.getUser(USER).<module>.<method>()`), never through the UI.
- **Page classes** hold only `protected readonly` decorator fields with literal selectors.
- **Actions methods** all carry `@Step('...')`; methods starting with `check` attach a screenshot automatically.
- **Decorators**: one action or one assertion per method, chainable (`await field.checkIsVisible().fill(value)`).
- **No hard-coded application values**: messages, labels, storage keys and API values come from `constants/` and `api/core/ApiConstants.ts`; credentials only from `user/Users.ts`.
- No code comments, no `waitForTimeout`.

## API layer

```ts
const user = router.user.getUser(SUPER_ADMIN);
const login = await user.auth.login(SUPER_ADMIN);
const permissions = await user.permission.getPermissions();
```

- Payloads are built with builders (`api/<module>/payload`), responses mapped to immutable records (`api/<module>/response`), endpoints come from `<Module>Endpoint` enums.
- Requests pass through a chain of handlers: reporting -> authentication (Bearer token, re-login on 401 / 10010) -> send.
- HTTP status is always 200; assert on `statusCode` (`ApiStatus`).

## Quality checks

```bash
npm run typecheck    # TypeScript
npm run lint         # framework rule check
```

`lint/framework-rules.mjs` contains custom ESLint rules that enforce the framework rules above. The **PR checks** workflow runs both on every pull request to `main` and reports violations as annotations on the changed lines.

## CI

| Workflow | Trigger | What it does |
|---|---|---|
| `PR checks` | every pull request to `main` | Type-check + framework rule check |
| `E2E tests` | manual (Actions -> E2E tests -> Run workflow) | Runs tests headless, publishes the Allure Dashboard and Traceability Matrix to GitHub Pages, uploads `allure-results` |

E2E workflow inputs:

| Input | Values | Example |
|---|---|---|
| `scope` | `all`, `tags`, `specs` | `tags` |
| `tags` | Playwright grep syntax (scope `tags`) | `@smoke` or `@smoke\|@HAT-T2` |
| `specs` | space-separated spec names / paths (scope `specs`) | `LoginTests AdminDashboardTests` |

The dashboard uses [Allure Dashboard](https://github.com/marketplace/actions/allure-dashboard). The traceability matrix reads the requirement id from the Allure label `requirement` and the test case id from the TMS link; the requirement list is generated from the scenario catalog (`npm run requirements:csv`).

Repository setup:
- Settings -> Pages -> Source: **GitHub Actions** (Pages on a private repository needs a paid plan).
- Branch protection on `main` requiring the **Framework rules** check.

## Zephyr Scale

```bash
npm run -s zephyr -- list [--folder login] [--label AUTH-03] [--search "invalid"]
npm run -s zephyr -- get HAT-T2
npm run -s zephyr -- create --file test-case.json [--dry-run]
npm run -s zephyr -- mark-automated HAT-T2 --spec tests/login/LoginTests.spec.ts --title "<test title>"
```

- Every automated test maps to one Zephyr test case (`tmsLink`); automated test cases carry the `automated` label.
- Zephyr folders mirror the `tests/` directory structure (`tests/login` -> `login`, `tests/api/auth` -> `api/auth`).
- Set `AUTOMATION_REPO_URL` in `.env` to also add a web link from the Zephyr test case to the spec.

## Claude Code skills

| Skill | Purpose |
|---|---|
| `/automate-test` | Automate a described test case: explores the app, writes page / actions / spec code under the framework rules, runs it and maps it to Zephyr |
| `/automate-zephyr-test <KEY>` | Read a Zephyr test case, check it is clear and has one verification point, then automate it (preconditions through the API) |
| `/praheal-test-advisor` | Application context from the user manual: missing tests (`gaps`), smoke suite (`smoke`), sanity / regression areas for a defect (`defect ...`) |

The application context (modules, numbered business rules, scenario catalog, impact map, open questions) lives in `.claude/skills/praheal-test-advisor/context/`. The source user manual is kept locally and is not part of the repository.

## Test users

Users and their credentials per role are defined in `user/Users.ts` (`SUPER_ADMIN`, `MEDICAL_DIRECTOR`, `CONSULTANT`, `RECEPTIONIST`). Roles with empty credentials must be filled in before tests for those roles can run.
