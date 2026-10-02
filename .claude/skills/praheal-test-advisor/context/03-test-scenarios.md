# Praheal - Test Scenario Catalog

Reference list of scenarios the application needs, derived from the user manual. It is the baseline for coverage-gap analysis: compare it with the specs in `tests/` and report what is missing.

Columns:
- **ID** - `<MODULE>-<nn>`; use it as a Playwright tag on the automated test (`@AUTH-01`).
- **Type** - F functional (happy path), N negative / validation, B boundary / calculation, R role / permission, I integration / end-to-end, U UI / display.
- **Pri** - P1 critical business flow or security, P2 important, P3 nice-to-have.
- **Smoke** - `S` = part of the smoke suite (see `04-impact-map.md` -> Smoke suite).
- **Rules** - business rules from `02-modules-and-rules.md`. Scenarios on rules marked (?) need clarification first (`05-open-questions.md`).

## AUTH - Authentication & Session

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| AUTH-01 | Staff login page shows Mobile No., Password, Login, Forgot Password | U | P1 | S | AUTH-R1 |
| AUTH-02 | Staff logs in with valid mobile + password and lands on the role's landing page | F | P1 | S | AUTH-R1, AUTH-R2 |
| AUTH-03 | Login with wrong password shows "Invalid Mobile No. Or Password." | N | P1 | S | AUTH-R1, AUTH-R15 |
| AUTH-04 | Login with unregistered mobile is rejected | N | P1 |  | AUTH-R1 |
| AUTH-05 | Empty mobile / password show "Please Enter Mobile No." / "Please Enter Password" | N | P2 |  | AUTH-R1 |
| AUTH-06 | Non-Indian / invalid-format mobile is rejected | N | P2 |  | AUTH-R1 |
| AUTH-07 | Inactive staff user cannot log in | R | P1 |  | AUTH-R3, USER-R2 |
| AUTH-08 | Staff of an inactive firm cannot log in | R | P2 |  | AUTH-R3, FIRM-R5 |
| AUTH-09 | Patient logs in on Patient Login URL and lands on Patient Dashboard | F | P1 | S | AUTH-R1, AUTH-R2 |
| AUTH-10 | Self-registered patient without shared credentials cannot log in | N | P2 |  | AUTH-R4 |
| AUTH-11 | International patient logs in with email | F | P3 |  | AUTH-R1 |
| AUTH-12 | Forgot password: OTP sent, valid OTP + compliant password resets it; new password works | F | P1 |  | AUTH-R5, AUTH-R6 |
| AUTH-13 | Forgot password: wrong / expired OTP rejected | N | P2 |  | AUTH-R5 |
| AUTH-14 | Password policy enforced (length 7 vs 8, missing upper / lower / digit / special) | B | P2 |  | AUTH-R6 |
| AUTH-15 | Change password with correct old password; login with new password | F | P2 |  | AUTH-R7 |
| AUTH-16 | Change password with wrong old password / mismatched confirm | N | P2 |  | AUTH-R7 |
| AUTH-17 | Login on a second screen logs out the first ("You are logged in from another screen") | F | P1 |  | AUTH-R9 |
| AUTH-18 | 40 minutes of inactivity logs the user out to the login page | B | P2 |  | AUTH-R8 |
| AUTH-19 | Firm Admin first login shows Subscription Terms modal; I Agree disabled until checkbox ticked | F | P2 |  | AUTH-R10 |
| AUTH-20 | Cancel on Subscription Terms logs out; modal not shown after acceptance; not shown to other roles | R | P3 |  | AUTH-R10 |
| AUTH-21 | Patient inactive > 90 days must verify OTP on login | B | P3 |  | AUTH-R11 |
| AUTH-22 | Staff inactive > 30 days must verify (OTP / email link) | B | P3 |  | AUTH-R12 |
| AUTH-23 | Logout clears branch context; next login starts clean | F | P3 |  | AUTH-R14, BR-R1 |

## FIRM - Firms & Branches (Super Admin)

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| FIRM-01 | Create firm with all mandatory details; 3 URLs shown with copy icons | F | P1 |  | FIRM-R1, FIRM-R3 |
| FIRM-02 | Duplicate sub-domain rejected | N | P1 |  | FIRM-R2 |
| FIRM-03 | Sub-domain not editable after creation | R | P2 |  | FIRM-R2 |
| FIRM-04 | Logo accepts only JPG/JPEG/PNG | N | P3 |  | FIRM-R1 |
| FIRM-05 | Firm Unique ID generated as first word of Name on App + PAN | B | P3 |  | FIRM-R4 |
| FIRM-06 | Firms list search by name / sub-domain / admin | F | P3 |  | FIRM-R5 |
| FIRM-07 | Mark firm inactive -> staff and patients cannot log in; reactivate restores | I | P2 |  | FIRM-R5, AUTH-R3 |
| FIRM-08 | Only one main branch; switching main branch unsets the previous | B | P2 |  | FIRM-R6 |
| FIRM-09 | Inactive branch allows only view / export; create & edit blocked | R | P1 |  | FIRM-R7 |
| FIRM-10 | Branch with dependencies cannot be deleted; without dependencies can | N | P2 |  | FIRM-R8 |
| FIRM-11 | User restriction: role limits summing above total rejected with message | N | P2 |  | FIRM-R10 |
| FIRM-12 | Reducing role limit below existing users blocked with message | N | P3 |  | FIRM-R11 |
| FIRM-13 | Shadow Consultant = No hides Shadow Consultants field in user form | R | P2 |  | FIRM-R9, USER-R3 |
| FIRM-14 | Enabling Pediatric module shows vaccination masters and Vaccination Chart tab | I | P2 |  | FIRM-R9, VAC-R1 |
| FIRM-15 | Firm management screens not visible to staff of other firms | R | P1 |  | FIRM-R12 |

## USER - User Management

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| USER-01 | Add consultant with mandatory fields, branch, role, practice timing | F | P1 |  | USER-R1 |
| USER-02 | Duplicate email / mobile within firm rejected | N | P1 |  | USER-R1 |
| USER-03 | Profile photo > 2 MB or wrong type rejected | N | P3 |  | USER-R1 |
| USER-04 | Deactivate user: login blocked, history preserved, appointments cancelled | I | P1 |  | USER-R2 |
| USER-05 | Shadow Consultants field visible only for MD / Consultant roles | R | P2 |  | USER-R3 |
| USER-06 | Replicate Start / End Time copies times to selected days; per-day override kept | F | P2 |  | USER-R4 |
| USER-07 | Creating user beyond role limit shows restriction message and disables Save | N | P2 |  | USER-R5, FIRM-R10 |

## ACL - Role & Access Management

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| ACL-01 | Create role with selected permissions for a branch | F | P1 |  | ACL-R1, ACL-R3 |
| ACL-02 | User without permission opening a screen URL sees Access Denied | R | P1 | S | ACL-R2 |
| ACL-03 | API request without permission is blocked by backend | R | P1 |  | ACL-R2 |
| ACL-04 | Staff without calendar access lands on welcome page | R | P2 |  | AUTH-R2 |
| ACL-05 | Non-admin sees only authorised branches when configuring roles | R | P2 |  | ACL-R3, ACL-R9 |
| ACL-06 | Consultation Plan / Session / Kriti tab disabled for a role is hidden | R | P2 |  | ACL-R5 |
| ACL-07 | Plan billing fields: no view => hidden / ***; no edit => read-only | R | P2 |  | ACL-R6 |
| ACL-08 | Remit Note view-only user sees disabled three-dot menu with tooltip; cannot add | R | P2 |  | ACL-R7 |
| ACL-09 | Edit Remit Note requires View; MD always has edit | R | P3 |  | ACL-R7 |
| ACL-10 | Granting "Apply Discount > 10%" to Accountant allows > 10% | R | P2 |  | ACL-R4, PAY-R4 |
| ACL-11 | Doctor / staff cannot see another branch's data | R | P1 |  | ACL-R9, BR-R1 |

## MST - Master Data

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| MST-01 | Add session; duplicate session name blocked | F/N | P2 |  | MST-R1 |
| MST-02 | Add sub-session with cost, duration, billing flag, instructions | F | P1 |  | MST-R2 |
| MST-03 | Sub-session duration drives calendar slot end time | I | P2 |  | MST-R2, APT-R1 |
| MST-04 | Sub-session with Billing = No is in plan but not on invoice | I | P2 |  | MST-R2, ACC-R2 |
| MST-05 | Add rate card; predefined 6 cannot be deleted | F/N | P2 |  | MST-R3 |
| MST-06 | Rate card bulk import requires branch; branch pricing used, fallback to main branch | I | P2 |  | MST-R3 |
| MST-07 | Add drug with defaults; selecting it in Rx auto-fills frequency / type / note / duration | I | P2 |  | MST-R4, CON-R5 |
| MST-08 | Drugs / conditions / provisional diagnosis import with sample template; export | F | P3 |  | MST-R4, MST-R5 |
| MST-09 | Import file with wrong format rejected with message | N | P3 |  | MST-R4 |
| MST-10 | Chief Complaints "Frequently Used" drives quick suggestions | I | P3 |  | MST-R6, CON-R12 |
| MST-11 | Add district under a state; appears in address dropdowns | F | P3 |  | MST-R7 |
| MST-12 | Create patient tag with colour | F | P3 |  | MST-R8 |
| MST-13 | Templates (history, investigations, clinical note, prescription) auto-populate in consultation | I | P2 |  | MST-R9 |

## PAT - Patients

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| PAT-01 | Receptionist registers patient with mandatory fields; Registration ID generated | F | P1 | S | PAT-R2, PAT-R8 |
| PAT-02 | Mandatory field validation on registration | N | P1 |  | PAT-R2 |
| PAT-03 | Duplicate mobile within firm rejected | N | P1 |  | PAT-R2 |
| PAT-04 | WhatsApp No. auto-fills from Mobile and is editable | U | P2 |  | PAT-R3 |
| PAT-05 | Selecting City loads Area dropdown | I | P3 |  | PAT-R4 |
| PAT-06 | Patient self-registers via Registration URL; branch preselected from link | F | P2 |  | PAT-R1, PAT-R5 |
| PAT-07 | Registration ID format and monthly sequence | B | P2 |  | PAT-R8 |
| PAT-08 | Photo type / size validation | N | P3 |  | PAT-R7 |
| PAT-09 | Pediatric toggle shows and requires pediatric fields | F/N | P2 |  | PAT-R10 |
| PAT-10 | Patient listing search by name, mobile, Registration ID, referring consultant | F | P1 | S | PAT-R12 |
| PAT-11 | Branch filter on patient listing | F | P2 |  | PAT-R12, BR-R2 |
| PAT-12 | Export patients to Excel; import with sample template | F | P3 |  | PAT-R12 |
| PAT-13 | Send / resend login credentials | F | P2 |  | PAT-R12, NTF-R1 |
| PAT-14 | Change mobile number requires OTP on new number | F | P2 |  | PAT-R9 |
| PAT-15 | Unsubscribe from notifications; login notifications still sent | I | P3 |  | PAT-R6, NTF-R2 |
| PAT-16 | Referral details visible to Receptionist, Admin, MD, Accountant | R | P3 |  | PAT-R11 |
| PAT-17 | Assign tags; tags shown on listing, calendar, consultation; logged in file history | I | P3 |  | PAT-R13 |
| PAT-18 | Patient history transfer request Pending -> Approved shows history; Rejected does not | I | P2 |  | PAT-R14 |
| PAT-19 | Transfer blocked while patient has an active plan | N | P2 |  | PAT-R14, PLN-R5 |
| PAT-20 | Enquiry captured and converted to registered patient from appointment modal | I | P2 |  | PAT-R1 |

## APT - Appointments

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| APT-01 | Calendar loads in Day view with consultant list and counts; MDs on top | U | P1 | S | APT-R4 |
| APT-02 | Switch Day / Week / Month / List views | U | P2 |  | APT-R4 |
| APT-03 | Book First Consultation from a slot; mobile auto-fills patient details | F | P1 | S | APT-R1, APT-R5 |
| APT-04 | Past date / time cannot be booked | N | P1 |  | APT-R2 |
| APT-05 | Slot outside practice timing shown grey; booking behaviour per clarification | B | P2 |  | APT-R3 |
| APT-06 | Second First Consultation for same patient not allowed | N | P1 |  | APT-R5 |
| APT-07 | Follow-up within 4 days is free; no payment needed | B | P1 |  | APT-R5 |
| APT-08 | Follow-up on day 5 is chargeable; checkout blocked without payment | B | P1 |  | APT-R5 |
| APT-09 | Return after 2 months treated as New Consultation with full charge | B | P2 |  | APT-R5 |
| APT-10 | Dummy appointment has no payment step and appears in Patient File | F | P2 |  | APT-R5, PFH-R1 |
| APT-11 | Reschedule appointment before check-in; patient notified | F | P1 |  | APT-R6, APT-R7 |
| APT-12 | Cancel with reason frees the slot | F | P1 |  | APT-R7 |
| APT-13 | Edit / cancel not possible after check-in; check-in only on the day | N | P2 |  | APT-R6 |
| APT-14 | Before 2 PM / After 2 PM / Today filters and counts (14:00 boundary) | B | P2 |  | APT-R9 |
| APT-15 | Holiday date marked; booking behaviour per clarification | B | P2 |  | APT-R10, HOL-R3 |
| APT-16 | Consultation Start from Add Appointment marks Engaged and opens consultation | F | P2 |  | APT-R12 |
| APT-17 | Consultation Start hidden for receptionist / unrelated consultant | R | P2 |  | APT-R12 |
| APT-18 | Shadow consultant sees primary's appointments and can start them | R | P2 |  | APT-R13 |
| APT-19 | Appointment List branch column / filter and action column | F | P2 |  | APT-R14 |
| APT-20 | Status indicators Waiting / Engaged / Checked Out / Cancelled / No-Show shown correctly | U | P2 |  | APT-R8 |

## PAY - Payments & Discounts

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| PAY-01 | Collect full payment at booking; receipt created; purpose auto-filled | F | P1 | S | PAY-R1, ACC-R5 |
| PAY-02 | Partial payment for consultation leaves due amount | B | P1 |  | PAY-R2 |
| PAY-03 | Collect payment later from Appointment List / View modal | F | P2 |  | PAY-R3 |
| PAY-04 | Receptionist discount 10% allowed, 10.01% / 11% blocked | B | P1 |  | PAY-R4 |
| PAY-05 | MD / Firm Admin can apply > 10% | R | P2 |  | PAY-R4 |
| PAY-06 | Each payment mode (Cash, Card, UPI, Cheque, Bank Transfer) accepted | F | P3 |  | PAY-R1 |
| PAY-07 | Payment collection sends notification when enabled | I | P3 |  | ACC-R4, NTF-R1 |

## QUE - Patient Queue

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| QUE-01 | Checked-in patient appears in Waiting with blue flag | F | P1 | S | QUE-R1, QUE-R2 |
| QUE-02 | Queue order follows check-in time, not booking time | B | P2 |  | QUE-R3 |
| QUE-03 | Start Consultation moves patient to Engaged (orange) | F | P1 |  | QUE-R2, QUE-R4 |
| QUE-04 | Done but not checked out shows orange in Done; checked out turns green | F | P2 |  | QUE-R2 |
| QUE-05 | Click in Engaged queue opens consultation for consultant / shadow / MD only | R | P2 |  | QUE-R4 |
| QUE-06 | Before / After 2 PM split in queue | B | P3 |  | QUE-R1, APT-R9 |

## CON - Consultation

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| CON-01 | Open consultation for an Engaged First Consultation; correct tabs shown | F | P1 | S | CON-R1 |
| CON-02 | Tabs by appointment type (Consultation tab hidden for Plan / Dummy; Sub-Session Note only for Plan) | R | P1 |  | CON-R1 |
| CON-03 | Record vitals, complaints, history, investigations, notes, diagnosis, Rx; submit -> Done | F | P1 | S | CON-R2, CON-R4 |
| CON-04 | Returning patient: flag, allergies, relationship status, chief complaints auto-filled | F | P2 |  | CON-R3 |
| CON-05 | Consultant can edit within 24 h; cannot after 24 h; MD can | B | P1 |  | CON-R4 |
| CON-06 | Rx auto-populate from prescription template | F | P2 |  | CON-R5, MST-R9 |
| CON-07 | Duplicate drug blocked with message; template duplicates removed with notice | N | P1 |  | CON-R6 |
| CON-08 | Duplicate investigation / Kriti blocked; same item allowed in another consultation | N | P2 |  | CON-R6 |
| CON-09 | Print / share Rx; included sections selectable; status Shared / Printed | F | P1 |  | CON-R7 |
| CON-10 | Rx in each language; static fields translated, advice/instructions translated | F | P2 |  | CON-R8 |
| CON-11 | Supplementary fields disabled at firm level are hidden; always expanded | R | P3 |  | CON-R9 |
| CON-12 | Collapsible sections toggle ON / OFF behaviour | F | P3 |  | CON-R10 |
| CON-13 | Instant Action menu; Rx PDF disabled with tooltip when no Rx | U | P3 |  | CON-R11 |
| CON-14 | Chief complaint quick suggestions: 5 buttons, clicked button disabled | U | P3 |  | CON-R12 |
| CON-15 | Second user sees blocked screen with name; read-only; released after save or 10 min idle | I | P1 |  | CON-R13 |
| CON-16 | Follow-up reminder scheduled for each interval | F | P3 |  | CON-R14 |
| CON-17 | Copy Last Prescription allowed for same consultant / shadow; blocked for others incl. MD | R | P2 |  | CON-R15 |
| CON-18 | Attachments per section: allowed types, 10 MB limit, multiple files, visible in file history | B | P2 |  | CON-R16 |
| CON-19 | Investigation marked completed only after attachment upload | B | P3 |  | CON-R2 |
| CON-20 | Shadow consultant can act on all tabs; activity logged under shadow | R | P2 |  | CON-R17 |

## PLN / SES / PRC / SSN / KRT - Treatment

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| PLN-01 | Create plan with sessions / sub-sessions, given & accepted counts; status Passive | F | P1 | S | PLN-R1, PLN-R2 |
| PLN-02 | Freeze plan prevents changes | R | P1 |  | PLN-R2 |
| PLN-03 | Tentative end date calculation and override | B | P2 |  | PLN-R3 |
| PLN-04 | Hold extends end date by hold date - today | B | P1 |  | PLN-R4 |
| PLN-05 | Stop sets end date to today; new sub-session appointments blocked | B | P1 |  | PLN-R5 |
| PLN-06 | Privilege hides dues on patient portal until date | I | P2 |  | PLN-R6, PTL-R4 |
| PLN-07 | Plan discount fixed / % with 10% cap | B | P2 |  | PLN-R8 |
| PLN-08 | Create plan invoice; second invoice for same plan blocked | N | P1 |  | ACC-R2 |
| PLN-09 | Assign Kriti and extend (2 / 6 / 12 months); history recorded | F | P2 |  | PLN-R9 |
| PLN-10 | Carry-forward: extra appointments added under same plan after payment | I | P3 |  | PLN-R7 |
| SES-01 | Schedule sub-sessions; summary counts update | F | P1 |  | SES-R1 |
| SES-02 | Plan dates follow earliest / latest scheduled sub-session | B | P2 |  | SES-R2 |
| SES-03 | Delete session disabled until > 3 cancellations / no-shows | B | P2 |  | SES-R3 |
| SES-04 | Consultant dropdown limited to plan consultants | R | P3 |  | SES-R4 |
| SES-05 | Play button disabled before the appointment date | B | P2 |  | SES-R5 |
| PRC-01 | Create primary + additional procedure; primary excluded from additional list | F | P2 |  | PRC-R1 |
| PRC-02 | Add follow-up; procedure date locked afterwards | B | P2 |  | PRC-R2 |
| PRC-03 | Total Bill / Consultant Share visible only to Admin, MD, Accountant | R | P2 |  | PRC-R3 |
| SSN-01 | Sub-session note only on Plan appointment; submit marks Completed | F | P1 |  | SSN-R1, SSN-R2 |
| SSN-02 | Sub-session note edit after 24 h only by MD | B | P2 |  | SSN-R2 |
| KRT-01 | Allocate Kriti exercises with content and attachments | F | P2 |  | KRT-R1 |
| KRT-02 | Patient sees Kriti only after Kriti payment | I | P2 |  | KRT-R2 |
| KRT-03 | Kriti hidden from patient 5 days after plan end unless extended | B | P2 |  | KRT-R3 |

## PFH / BRD - Patient File & Board

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| PFH-01 | File history shows consultations, plans, Kriti, procedures | F | P2 |  | PFH-R1 |
| PFH-02 | Filters (consultant, date, branch, type) and PDF export | F | P3 |  | PFH-R2 |
| BRD-01 | Whiteboard note visible to other users | R | P3 |  | BRD-R1 |
| BRD-02 | My Note private; Admin / MD see all | R | P3 |  | BRD-R2 |
| BRD-03 | Remit Note visible only to permitted roles | R | P2 |  | BRD-R3, ACL-R7 |
| BRD-04 | Version history maintained per board section | F | P3 |  | BRD-R4 |

## ACC - Accounts

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| ACC-01 | Invoice list loads; invoice opened shows branch name | U | P1 | S | ACC-R1 |
| ACC-02 | Create invoice from appointment view / list | F | P1 |  | ACC-R1 |
| ACC-03 | One item per invoice; plan invoice rows not manually editable | N | P2 |  | ACC-R2 |
| ACC-04 | Cancel invoice without receipts; blocked with active receipt; no delete after collection | N | P1 |  | ACC-R3 |
| ACC-05 | Receipt list, print / share; cancel only if invoice not cancelled | F | P2 |  | ACC-R5 |
| ACC-06 | Outstanding Paid Receipt settles previous dues | I | P2 |  | ACC-R6 |
| ACC-07 | Refund receipt reflected in payment history | I | P2 |  | ACC-R6 |
| ACC-08 | Vaccination invoice lines and With Receipt print | I | P3 |  | ACC-R7 |

## PTL - Patient Portal

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| PTL-01 | Patient dashboard shows today's / upcoming appointments, dues, plan progress | F | P1 | S | PTL-R1 |
| PTL-02 | Appointment list statuses; Rx download / share; instructions hidden after download | F | P2 |  | PTL-R2 |
| PTL-03 | Plan appointment details shown | U | P3 |  | PTL-R3 |
| PTL-04 | Plans screen values and due amount | F | P2 |  | PTL-R4 |
| PTL-05 | Kriti list with accessible-till date and exercises | F | P2 |  | PTL-R5 |
| PTL-06 | Profile is read-only | R | P3 |  | PTL-R6 |
| PTL-07 | Patient cannot open staff URLs / other patients' data | R | P1 |  | ACL-R2 |

## NTF / RPT / DSH / LV / HOL / VAC / BR / SYS

| ID | Scenario | Type | Pri | Smoke | Rules |
|---|---|---|---|---|---|
| NTF-01 | Booking / reschedule / cancel trigger notifications per subscription | I | P2 |  | NTF-R1 |
| NTF-02 | Non-India patient gets no SMS, only WhatsApp / email | R | P3 |  | NTF-R3 |
| NTF-03 | Team Message Hub delivers messages; unread count updates | F | P3 |  | NTF-R4 |
| RPT-01 | Each report exports Excel with selected filters | F | P2 |  | RPT-R1, RPT-R2 |
| RPT-02 | Report data scoped by branch filter | R | P2 |  | RPT-R2, BR-R2 |
| DSH-01 | Admin dashboard loads with Patients, Accounts, Appointments, Users sections | U | P1 | S | DSH-R1 |
| DSH-02 | Dashboard filters by date, consultant, branch; consolidated when branch filter cleared | F | P2 |  | DSH-R2 |
| DSH-03 | Dashboard counts match underlying records | I | P2 |  | DSH-R1 |
| LV-01 | Apply leave; approve / reject by authorised role | F | P2 |  | LV-R1, LV-R2 |
| LV-02 | Leave blocked until appointments in the period are rescheduled | N | P2 |  | LV-R4 |
| HOL-01 | Add / edit / delete holiday for all or specific branches | F | P2 |  | HOL-R1 |
| HOL-02 | Holiday shown only on that branch's calendar | R | P2 |  | HOL-R2 |
| HOL-03 | Existing appointment on new holiday triggers reschedule / cancel notification | I | P3 |  | HOL-R3 |
| VAC-01 | Configure Marketed By -> Vendor -> Brand -> Vaccine; SKU auto-generated | F | P2 |  | VAC-R2 |
| VAC-02 | Add inventory; amounts auto-calculated; stock updated | B | P2 |  | VAC-R3 |
| VAC-03 | Vaccination chart statuses by DOB (Due / Overdue / Administered / Optional) | B | P2 |  | VAC-R4 |
| VAC-04 | Administer vaccine decrements inventory and adds invoice line | I | P2 |  | VAC-R5, ACC-R7 |
| VAC-05 | No vaccination permission hides tab, masters and invoice lines | R | P3 |  | VAC-R6 |
| BR-01 | Branch selector switches data on dashboard, calendar, patients, billing | F | P1 | S | BR-R1 |
| BR-02 | Backend rejects branch the user is not assigned to | R | P1 |  | BR-R1, ACL-R9 |
| BR-03 | Branch column / filter present on all listed screens | U | P3 |  | BR-R2 |
| SYS-01 | Right-click menu disabled; Ctrl+C and app buttons still work | U | P3 |  | SYS-R1 |
| SYS-02 | PWA prompt shown once per session | U | P3 |  | SYS-R2 |
