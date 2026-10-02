---
name: automate-zephyr-test
description: Read a manual test case from Zephyr Scale (Jira project HAT), check that its preconditions and UI steps are clear and that it has a single verification point, review it against the Praheal application context to highlight gaps, then automate it - preconditions through API actions, UI steps with the automate-test skill. Unclear or ambiguous test cases are not automated; corrections are suggested instead. Use when the user gives a Zephyr test case key (e.g. HAT-T12), asks to automate test cases from Zephyr, or wants Zephyr manual tests reviewed.
argument-hint: <Zephyr test case key(s), e.g. HAT-T12 HAT-T13 | list [--folder <name>] [--status <name>]>
---

# Automate a Zephyr Scale test case

Request:

$ARGUMENTS

Zephyr project: `HAT` on `https://putitrightdone-team.atlassian.net` (Zephyr Scale Cloud, API `https://api.zephyrscale.smartbear.com/v2`).

## How manual test cases are written

Every Zephyr test case has two parts, and they are automated differently:

| Part | Zephyr field | Purpose | Automated with |
|---|---|---|---|
| **Preconditions** | Precondition (and setup steps at the start, if any) | Everything that must exist before the UI actions start: user / role, branch, firm settings, patients, appointments, plans, payments, masters... | **API actions only** - `router` fixture in `beforeEach` (or a fixture); never through the UI |
| **UI steps** | Test script steps (action, test data, expected result) | The scenario actually under test | `automate-test` skill (page, actions, spec; decorators; `@Step`) |

The UI steps must start from the state the preconditions create. If the UI steps include setup that is not part of the scenario (e.g. registering a patient before testing booking), treat it as a precondition and do it through the API.

## 0. Access - secrets

- The API token lives only in the gitignored `.env` (`ZEPHYR_API_TOKEN`, `ZEPHYR_BASE_URL`, `ZEPHYR_PROJECT_KEY`); `.env.example` documents the variables.
- Always go through the read-only client: `npm run -s zephyr -- <command>`. Never print, echo, copy or log the token or `.env`; never put it in `.mcp.json`, code, specs, reports or commit messages.
- If the client says the token is missing or the API returns 401, ask the user to add a valid token to `.env` (Zephyr Scale -> Settings -> API Access Tokens) and stop.

## 1. Fetch the test case(s)

- One or more keys: `npm run -s zephyr -- get <KEY>` (Markdown) for each key. Use `--json` when you need exact field values.
- `list` request: `npm run -s zephyr -- list [--folder <name>] [--status <name>]`, show the table and ask which keys to automate.
- Called test cases are expanded automatically (`from HAT-Tx`); their steps count as part of the test case.

## 2. Clarity gate - automate only clear test cases

Read the Praheal context in `.claude/skills/praheal-test-advisor/context/` (all five files), then check the test case. It is **not automatable** if any of the following is true:

**Preconditions**
- Missing or empty while the UI steps clearly need existing state.
- The user / role is not stated, or the role has no credentials in `user/Users.ts`.
- Required data is not specified precisely enough to create it (e.g. "a patient with a plan" without plan status, sessions, payment state; "an appointment" without type, date, consultant, branch).
- Setup that cannot be done through the API and is not available as an existing API action, and the required endpoint cannot be identified (see step 4).
- Depends on another test, on manual data ("use patient Ramesh"), or on environment state that may not exist.

**UI steps**
- An action without a clear target or input ("fill the form", "update details", "check the screen").
- An expected result missing, vague or not observable ("works fine", "displayed properly", "as expected", "success").
- An expected result that contradicts a business rule in `02-modules-and-rules.md`, or relies on a rule marked (?) in `05-open-questions.md`.
- Steps whose order or outcome is ambiguous (several possible screens / messages / outcomes).
- Steps that cannot be verified in an automated run (real SMS / WhatsApp / email delivery, real OTP, 40-minute waits) without an agreed alternative.
- **More than one verification point.** One test case = one verification point (one expected outcome that the test proves). A test case whose steps verify several independent outcomes (e.g. "error message shown" and "user stays on login page") must be split into separate Zephyr test cases with the same preconditions, one verification each. Expected results of intermediate steps ("the number is shown in the field") are not verification points.

When the gate fails: **do not write any code for that test case.** Report it with corrections (format in step 6) and move on to the next key. Do not guess the missing intent and do not "fix" the test silently in automation.

When the gate passes, continue - other improvements (step 3) do not block automation.

## 3. Review against the application context

For a test case that passed the gate:

1. **Mapping** - modules and business rules (`02-modules-and-rules.md`) exercised; matching catalog scenarios (`03-test-scenarios.md`), or a new scenario with the next free ID.
2. **Improvements to this test case only** (they do not block automation) - unspecified test data made concrete, combined actions split into separate steps, a stronger expected result for its single verification point taken from the rules (exact message, value, status). Never add a second verification point as an "improvement" - that would be a new test.

**Scope: review and improve only the requested test case.** Do not suggest additional or missing scenarios / test cases - other test cases may already be in drafting. Only when the user explicitly asks for missing tests, highlight the missing tests for that functionality (`/praheal-test-advisor gaps`).

If there are improvements, present them and automate the improved version - improvement suggestions are welcome by default. Ask only if an improvement would change what the test verifies (not just make it more precise). If there are none, continue.

## 4. Automate the preconditions through the API

1. List every precondition as concrete data: user, branch, records to create and their exact field values, and what the UI steps need from them (ids, names, mobile numbers, dates).
2. Use the API layer (`api/`, rules in CLAUDE.md "API layer"): `router.user.getUser(<USER>).<module>.<method>()`. Reuse existing modules and methods.
3. If an endpoint is missing:
   - Identify it from the application: perform the same action once in the Playwright MCP browser and read the request with `browser_network_requests` / `browser_network_request` (method, path, multipart fields, response shape).
   - Add it following the API rules: endpoint in `<Module>Endpoint`, payload type + `<Name>PayloadBuilder` in `payload/`, immutable response record in `response/`, method on `<Module>Api`, module registered in `api/UserApi.ts`, values from `api/core/ApiConstants.ts`.
   - If the endpoint cannot be identified or behaves unexpectedly, treat the test case as not automatable (step 2) and report what is missing.
4. Test data must be unique per run (e.g. generated mobile numbers / names) so tests are independent and can run in parallel; never depend on pre-existing records other than the users in `user/Users.ts` and seeded masters.
5. Setup runs in the spec's `beforeEach` (or a dedicated fixture when several specs share it), using the same user session as the UI (`browserSession.loginAs(<USER>)` shares the router's login - never call `auth.login()` for that user). Verify the API responses (`statusCode === ApiStatus.SUCCESS`) so a setup failure is reported as setup, not as a UI failure.

## 5. Automate the UI steps with the automate-test skill

Invoke the `automate-test` skill (Skill tool) with a self-contained description:
- Zephyr key and name, catalog scenario ID(s), smoke yes/no.
- User / role constant, whether login is under test (normally not -> `browserSession.loginAs`), and the start page.
- The precondition setup from step 4 (which `router` calls create which data, and the values the UI steps use) - automate-test puts it in `beforeEach` and must not repeat it through the UI.
- Numbered UI steps with concrete expected results (improved version if chosen).
- Required Allure metadata: the Zephyr test case ID as TMS link and the scenario ID(s) + `smoke` (if applicable) as tags, e.g. `Allure({ description: '...', tags: ['smoke', 'APT-03'], tmsLink: 'HAT-T12' })`. `tmsLink` renders a link to the Zephyr test case in Allure and adds the `@HAT-T12` tag automatically.
- Title from the Zephyr test case name (cleaned up); Allure description from the objective and expected results.

automate-test then explores the app, builds page / actions / spec code under the framework rules (one verification point per test), runs the test, and maps it to Zephyr: because the key is given, it marks this test case automated with `npm run -s zephyr -- mark-automated <KEY> --spec <spec path> --title "<test title>"`. Automate each passing test case in turn.

## 6. Report back

For each Zephyr key, one of:

**Not automated - corrections needed**
```
## <KEY> - <name>: NOT AUTOMATED
Reason: <which gate checks failed>
Corrections for Zephyr:
- Precondition: <what is missing / ambiguous> -> <suggested wording with concrete data>
- Step <n>: <problem> -> <suggested action / test data / expected result>
Related rules / open questions: <ids>
```
Give the corrected test case in full (preconditions + numbered steps with expected results), ready to paste into Zephyr; for a split, give each resulting test case in full. This skill never edits the text or steps of existing Zephyr test cases - it only marks automated ones (`automated` label, web link) and, via automate-test, creates missing manual test cases in the folder that mirrors the spec's directory under `tests/`.

**Automated**
- Spec file, test title, tags, run result.
- Zephyr test case marked automated (label / web link).
- Precondition API calls used, and any API endpoints / modules added.
- Improvements applied to the test case.
- Context files updated: new scenarios in `03-test-scenarios.md`; confirmed behaviour in `02-modules-and-rules.md` / `05-open-questions.md`.
