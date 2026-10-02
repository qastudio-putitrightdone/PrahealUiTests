---
name: praheal-test-advisor
description: QA advisor for the Praheal clinic management application. Uses the application context (modules, business rules, scenario catalog, dependency and impact map) built from the Praheal user manual to (1) find missing test scenarios and test cases, (2) define or review the smoke suite covering all major functionality, and (3) recommend sanity and regression areas for a reported defect. Use for test planning, coverage review, smoke-suite questions, defect impact analysis, and whenever Praheal functionality or business rules need to be understood.
argument-hint: <gaps [module] | smoke | defect <description> | question about Praheal>
---

# Praheal Test Advisor

Request:

$ARGUMENTS

## Context - read before answering

The application context lives next to this file in `context/` (`.claude/skills/praheal-test-advisor/context/`). Read the files the request needs; for anything non-trivial read all of them:

| File | Contains | Needed for |
|---|---|---|
| `01-application-overview.md` | Product, tenancy, roles, global constraints, QA environment, glossary | Every request |
| `02-modules-and-rules.md` | Modules, screens, numbered business rules `<MODULE>-R<n>`, (?) = ambiguous | Gaps, test design, defects |
| `03-test-scenarios.md` | Scenario catalog `<MODULE>-<nn>` with type, priority, smoke flag, rules | Gaps, smoke |
| `04-impact-map.md` | Smoke suite, module dependency graph, defect impact matrix, risk heuristics | Smoke, defects |
| `05-open-questions.md` | Contradictions in the manual, undocumented screens, environment caveats | Every request - never assert a contradicted rule |

The source document is `Praheal_User_Manual_24_09.pdf` at the project root. Go back to it when the context is not detailed enough, and update the context files with what you learn.

Also read the automation state when relevant:
- Specs: `tests/**/*.spec.ts`. A test covers a scenario when it declares it as requirement (`Allure({ requirement: 'AUTH-02', ... })` - find them with `grep -rn "requirement: 'AUTH-02'" tests`); tests without it are matched by title / description and reported as "probably covers".
- Actions (`actionsComponents/`), pages (`pages/`) and the API layer (`api/`) show which screens and endpoints are already automatable.

## Mode 1 - Missing scenarios and test cases (`gaps`)

Run this mode **only when the user explicitly asks for missing tests** (e.g. "what tests are missing for login", "add missing tests for booking"). Never volunteer missing scenarios while automating a single test.

1. Determine scope: whole application, a module (`gaps APT`), or a feature described by the user.
2. Build the coverage table: for each catalog scenario in scope -> Automated (tagged), Probably automated (untagged match), Not automated. Also check Zephyr: `npm run -s zephyr -- list --label <SCENARIO-ID>` / `--search` shows whether a manual test case exists and whether it carries the `automated` label.
3. Look for gaps the catalog itself does not list - derive them from the rules in `02-modules-and-rules.md`:
   - Every rule needs at least one positive and one negative / boundary scenario.
   - Every permission rule needs a permitted-role and a denied-role scenario.
   - Every date / amount rule needs boundary values (e.g. follow-up day 4 vs day 5, discount 10% vs 10.01%, 24 h edit window, 40 min logout).
   - Every branch-scoped screen needs an active-branch, inactive-branch and other-branch scenario.
   - Cross-module flows from the dependency graph need end-to-end scenarios (registration -> booking -> payment -> consultation -> plan -> invoice -> portal).
4. Output:
   - Coverage summary per module (counts: total / automated / missing, P1 missing highlighted).
   - Missing tests for that functionality, ordered P1 -> P3, each with **exactly one verification point**: proposed ID (next free number in the module), title, type, priority, rule references, preconditions (data to create through the API), steps, the single expected result, whether it belongs in smoke, and whether a Zephyr manual test case already exists.
   - Scenarios blocked by open questions (link the question number) - list them separately; do not invent the expected result.
5. When the user agrees:
   - Add the new scenarios to `03-test-scenarios.md` (keep the table format and ID sequence).
   - Create the missing manual test cases in Zephyr (one per verification point) with `npm run -s zephyr -- create --file <json>` (dry-run first; format and rules in the automate-test skill, step 6). The Zephyr folder mirrors the directory under `tests/` where the automated spec lives or will live (`login`, `dashboard`, `api/auth`, ...); labels = scenario ID (+ `smoke`).
   - Automate the agreed ones with `/automate-test` (passing the Zephyr key as `tmsLink`); automate-test marks them automated in Zephyr.

## Mode 2 - Smoke suite (`smoke`)

1. Start from the smoke suite in `04-impact-map.md` and the `S` flags in `03-test-scenarios.md`.
2. Check it still covers every major area: authentication, access control, branch context, dashboard, patient registration & search, booking, payment, queue, consultation, plan, accounts, patient portal (plus vaccination if the firm has the Pediatric module).
3. Report for each smoke scenario: automated (tagged `@smoke` + ID) or missing; flag smoke tests that are slow, depend on each other, or log in through the UI although login is not under test (they should use `browserSession.loginAs`).
4. Keep smoke small: one main-path scenario per area; anything else belongs in regression. Propose additions / removals with a reason.
5. Run instructions: `npm run test:smoke` (Playwright `--grep @smoke`); smoke failure blocks further testing.

## Mode 3 - Defect impact: sanity and regression (`defect <description>`)

1. Understand the defect: screen, role, branch, data, steps, actual vs expected. Ask for missing essentials (role, screen, appointment type) only if they change the answer.
2. Map it to modules and business rules in `02-modules-and-rules.md`. If the "expected" behaviour is one of the contradictions in `05-open-questions.md`, say so first - it may be a requirements question, not a defect.
3. Use the defect impact matrix and dependency graph in `04-impact-map.md`:
   - **Sanity** - the fixed scenario plus scenarios sharing the same screen / rule (narrow, fast).
   - **Regression** - downstream modules from the dependency graph and every rule that reuses the changed logic; apply the risk heuristics (money, clinical integrity, security, shared masters, date rules, role matrix).
4. Output:
   - Root area: module(s) and rule IDs.
   - Sanity checklist: scenario IDs + one-line checks, including the exact reproduction of the defect.
   - Regression areas: grouped by module with scenario IDs and why each is at risk; mark which are already automated (`requirement:` in specs) and give their Zephyr keys so they can be run with `npx playwright test --grep "@HAT-T1|@HAT-T2"` (or the E2E workflow, scope `tags`).
   - Roles / branches / data variations to include.
   - Missing scenarios revealed by the defect (feed back into Mode 1).

## General rules

- Base every statement on the context or the manual; quote the rule ID. If something is not documented, say so and suggest exploring the QA app (Playwright MCP) or asking the product owner.
- Never present a contradicted (?) rule as fact.
- Keep the context up to date: when the user confirms behaviour, answers an open question, or new features appear, update `02-modules-and-rules.md`, `03-test-scenarios.md`, `04-impact-map.md` and `05-open-questions.md` accordingly.
- Respect the framework rules in `CLAUDE.md` when proposing automation (login policy, decorators, constants, tags).
