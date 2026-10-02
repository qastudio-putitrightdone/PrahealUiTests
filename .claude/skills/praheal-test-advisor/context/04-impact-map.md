# Praheal - Smoke Suite, Dependencies and Defect Impact Map

## Smoke suite

Goal: in a few minutes, prove every major business area is up and its main path works. One scenario per area, ordered like a real clinic day. All are tagged `S` in `03-test-scenarios.md`.

| # | Area | Scenario IDs | Why it is in smoke |
|---|---|---|---|
| 1 | Authentication | AUTH-01, AUTH-02, AUTH-03 | Nothing works without login; also proves API + session |
| 2 | Access control | ACL-02 | Proves permission enforcement is active (security) |
| 3 | Branch context | BR-01 | Every screen depends on branch scoping |
| 4 | Dashboard | DSH-01 | Landing page for Admin / MD; aggregates all modules |
| 5 | Patient registration & search | PAT-01, PAT-10 | Entry point of every patient journey |
| 6 | Appointment booking | APT-01, APT-03 | Core revenue and scheduling flow |
| 7 | Payment | PAY-01 | Billing + receipt creation |
| 8 | Queue | QUE-01 | Day flow / check-in |
| 9 | Consultation | CON-01, CON-03 | Clinical heart of the product |
| 10 | Treatment plan | PLN-01 | Plans drive sessions, invoices, Kriti |
| 11 | Accounts | ACC-01 | Financial records available |
| 12 | Patient portal | AUTH-09, PTL-01 | Patient-facing channel |

Execution guidance:
- Tag smoke tests `@smoke` (via `Allure({ tags: ['smoke'], requirement: '<ID>', tmsLink: '<HAT-Tn>' })`) and run `npm run test:smoke` (or the E2E workflow with scope `tags` and `@smoke`).
- Smoke tests that are not about login start with `browserSession.loginAs(<USER>)`; only AUTH-* smoke tests use the login screen.
- Run smoke after every deployment and before any regression run; a smoke failure blocks further testing.

## Module dependency graph

`A -> B` means B consumes data or behaviour from A (a defect in A can break B).

```
FIRM ─┬─> BR ──> (every module: data scoped by branch)
      ├─> USER ─┬─> APT (practice timings, consultant list, shadows)
      │         ├─> ACL
      │         └─> AUTH (active flag, user limits)
      └─> AUTH (firm active, Subscription Terms)
ACL ──────> every screen and API (Access Denied / middleware), CON tabs, PLN billing fields, BRD remit, VAC, LV, HOL
MST ─┬─> PAT (districts, areas, tags)
     ├─> APT (sub-session duration -> slot length)
     ├─> CON (drugs, templates, complaints, diagnosis, conditions)
     ├─> PLN / SES (sessions, sub-sessions, cost, billing flag)
     ├─> PAY / ACC (rate cards, branch pricing)
     └─> VAC (vaccine masters, inventory)
PAT ─┬─> APT (patient lookup by mobile)
     ├─> PTL (credentials, profile)
     └─> NTF (contact numbers, subscription)
APT ─┬─> PAY (purpose, partial rules)
     ├─> QUE (statuses, check-in)
     ├─> CON (appointment type decides tabs)
     ├─> ACC (invoice linked to appointment)
     ├─> DSH (counts), NTF (booking notifications), PTL (appointments)
HOL / LV ─> APT (availability)
CON ─┬─> PLN (plan created from consultation)
     ├─> PFH, PTL (Rx), RPT (consultation report), QUE (Done / checkout)
PLN ─┬─> SES ─> SSN, KRT
     ├─> ACC (plan invoice, Kriti extension invoice)
     ├─> PTL (plans, dues, privilege), PAT (transfer blocked by active plan), RPT (plan report)
ACC ──> PTL (dues), DSH (collections), NTF (payment confirmation), RPT
VAC ──> CON (Vaccination Chart tab), ACC (vaccine invoice lines), RPT (vaccination report)
AUTH ─> everything (session, single-session rule, auto logout)
```

## Defect impact matrix

For a defect in a component, run:
- **Sanity** - narrow, fast: re-test the fixed scenario plus the closest scenarios that share the same screen / rule. Goal: the fix works and did not break its immediate neighbourhood.
- **Regression** - wider: everything downstream in the dependency graph and every rule that reuses the changed logic.

| Defect area (module / rule) | Sanity (re-test) | Regression areas |
|---|---|---|
| Staff / patient login (AUTH-R1..R4) | AUTH-01..10, AUTH-17 | Smoke suite in full; role landing pages (AUTH-R2); BrowserSession API login; Patient portal (PTL) |
| Forgot / change password, policy (AUTH-R5..R7) | AUTH-12..16 | Login (AUTH-02, AUTH-09); NTF login OTP notifications |
| Session handling (AUTH-R8, R9, R14) | AUTH-17, AUTH-18, AUTH-23 | Consultation lock (CON-15); branch context (BR-01); long-running flows (CON-03, PLN-01) |
| Firm / branch setup (FIRM-R1..R9) | FIRM-01..10 | Login (AUTH-07/08); all branch-scoped screens (BR-01..03, ACL-11); rate card fallback (MST-06); patient transfer (PAT-18/19) |
| User limits / user management (FIRM-R10/11, USER-R1..R5) | USER-01..07, FIRM-11/12 | Calendar consultant list & practice timing (APT-01, APT-05); shadow behaviour (APT-18, CON-17, CON-20); login (AUTH-07) |
| Permissions / roles (ACL-R1..R9) | ACL-01..11 for the changed permission | Every screen guarded by that permission; consultation tabs (CON-02); plan billing (ACL-07, PLN-07); remit notes (BRD-03); discounts (PAY-04/05); leave / holiday menus |
| Masters - sessions / sub-sessions (MST-R1, R2) | MST-01..04 | Plan creation (PLN-01..05), session scheduling (SES-01..05), calendar slot length (MST-03), invoices (ACC-02/03), plan report (RPT-01) |
| Masters - rate cards (MST-R3) | MST-05, MST-06 | Payment amounts (PAY-01/02), invoices (ACC-01..04), branch pricing (BR-01) |
| Masters - drugs / templates / complaints (MST-R4..R9) | MST-07..13 | Rx entry (CON-03, CON-06, CON-07), Rx print / language (CON-09, CON-10), copy last Rx (CON-17) |
| Patient registration (PAT-R1..R10) | PAT-01..09 | Appointment lookup by mobile (APT-03), patient portal login (AUTH-09), notifications (NTF-01), Registration ID in invoices (ACC-01), pediatric / vaccination (VAC-03) |
| Patient listing / import / export (PAT-R12) | PAT-10..13 | Search used across booking (APT-03); credentials (AUTH-09) |
| Patient transfer (PAT-R14) | PAT-18, PAT-19 | Plan Stop (PLN-05), file history visibility (PFH-01), branch access (ACL-11) |
| Booking / calendar (APT-R1..R4, R12..R14) | APT-01..05, APT-16..19 | Payments (PAY-01..03), queue (QUE-01..03), consultation open (CON-01), dashboard counts (DSH-03), notifications (NTF-01), patient portal appointments (PTL-01/02) |
| Appointment type & charging rules (APT-R5) | APT-06..10 | Payments / partial (PAY-02), checkout blocking (QUE-04), consultation tabs (CON-02), invoices (ACC-02), dashboard counts by type (DSH-03) |
| Reschedule / cancel (APT-R6, R7) | APT-11..13 | Queue order (QUE-02), session counts and delete rule (SES-01, SES-03), leave (LV-02), notifications (NTF-01) |
| Time filters (APT-R9, QUE-R1) | APT-14, QUE-06 | Dashboard Before/After 2 PM counts (DSH-01/03) |
| Holidays / leave (HOL-*, LV-*) | HOL-01..03, LV-01, LV-02 | Booking availability (APT-03..05, APT-15), branch-specific calendars (HOL-02), notifications |
| Payments / discounts (PAY-R1..R4) | PAY-01..06 | Receipts & invoices (ACC-02..07), plan discount (PLN-07), dashboard collections (DSH-03), patient dues (PTL-01/04), notifications (PAY-07) |
| Queue (QUE-R1..R5) | QUE-01..06 | Consultation open / lock (CON-01, CON-15), dashboard queue widget (DSH-01), checkout + payment rule (APT-08) |
| Consultation core (CON-R1..R5) | CON-01..06 | Patient file (PFH-01), Rx portal download (PTL-02), consultation report (RPT-01), queue Done state (QUE-04), plan creation entry (PLN-01) |
| Edit window / MD override (CON-R4, SSN-R2) | CON-05, SSN-02 | Any audit/edit flow on consultations and sub-session notes; MD permissions (ACL-01) |
| Rx duplicates / templates / copy (CON-R5, R6, R15) | CON-06, CON-07, CON-08, CON-17 | Rx print / language (CON-09, CON-10), drug master defaults (MST-07), shadow rules (APT-18, CON-20) |
| Rx print / share / translation (CON-R7..R9) | CON-09..11 | Patient portal Rx (PTL-02), notifications (NTF-01) |
| Concurrent lock (CON-R13) | CON-15 | Shadow access (CON-20), session timeout (AUTH-18) |
| Plan (PLN-R1..R11) | PLN-01..10 | Sessions (SES-*), sub-session notes (SSN-01), Kriti (KRT-*), plan invoices (PLN-08, ACC-03), patient portal plans / dues (PTL-04), transfer (PAT-19), plan report (RPT-01), dashboard active plans (DSH-03) |
| Sessions (SES-R1..R5) | SES-01..05 | Plan dates (PLN-03..05), calendar plan appointments (APT-03), sub-session notes (SSN-01), patient portal plan progress (PTL-01) |
| Procedures (PRC-R1..R4) | PRC-01..03 | Procedure report (RPT-01), dashboard procedures (DSH-01), plan linkage (PLN-01) |
| Kriti (KRT-R1..R4, PLN-R9) | KRT-01..03, PLN-09 | Kriti invoices (ACC-02), patient portal Kriti (PTL-05), dashboard Kriti expirations (DSH-01), notifications (NTF-01) |
| Board (BRD-R1..R4) | BRD-01..04 | Remit permissions (ACL-08/09), shadow access (CON-20) |
| Invoices (ACC-R1..R3) | ACC-01..04 | Receipts (ACC-05..07), plan invoice (PLN-08), dashboard accounts (DSH-03), patient dues (PTL-01/04), reports |
| Receipts / refunds (ACC-R5, R6) | ACC-05..07 | Invoice cancel rule (ACC-04), patient dues, dashboard receipts |
| Patient portal (PTL-*) | PTL-01..07 | Patient login (AUTH-09..11), Rx share (CON-09), plan privilege (PLN-06), Kriti access (KRT-02/03) |
| Notifications (NTF-*) | NTF-01..03 | Every trigger listed in NTF-R1 for the changed channel; subscription (PAT-15) |
| Reports (RPT-*) | RPT-01, RPT-02 | Branch scoping (BR-03); source modules of the affected report |
| Dashboard (DSH-*) | DSH-01..03 | Source modules of the wrong widget (APT, ACC, PLN, KRT, USER) |
| Vaccination (VAC-*) | VAC-01..05 | Pediatric registration (PAT-09), consultation tabs (CON-02), invoices (ACC-08), vaccination report (RPT-01) |
| Branch selector / scoping (BR-R1..R3) | BR-01..03, ACL-11 | Every branch-scoped listing (BR-R2 list), dashboard consolidation (DSH-02), reports (RPT-02), holidays (HOL-02) |

## Risk heuristics for prioritising regression

1. **Money first** - anything touching amounts, discounts, invoices, receipts, dues (PAY, ACC, PLN billing) gets full regression of downstream financial screens.
2. **Clinical record integrity** - consultation submit, edit window, Rx, lock, file history: regress all consultation tabs for at least two appointment types (First + Plan).
3. **Security / access** - any ACL, AUTH or branch defect: regress with at least two roles (one permitted, one not) and two branches.
4. **Shared masters** - a master change ripples into every module that consumes it (see graph); regress the main consumer flow end-to-end.
5. **Date rules** - follow-up 4-day / 2-month windows, 24 h edit, plan hold / stop, Kriti 5 days, 40 min logout: include boundary values (day 4 / 5, 23:59 / 24:01).
6. **Role matrix** - for permission-sensitive defects test Firm Admin, MD, Consultant, Receptionist, Accountant, Patient as applicable.
