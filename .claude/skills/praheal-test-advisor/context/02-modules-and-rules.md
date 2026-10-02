# Praheal - Modules, Screens and Business Rules

Each module has a code. Business rules are numbered `<CODE>-R<n>`; test scenarios (`03-test-scenarios.md`) and the impact map (`04-impact-map.md`) refer to them. Rules marked **(?)** are ambiguous or contradicted in the manual - see `05-open-questions.md` before asserting them.

---

## AUTH - Authentication & Session

Screens: Staff Login (`/staff-login`), Patient Login (`/patient-login`), Forgot Password, Change Password (profile dropdown), Subscription Terms modal, OTP / verification screens.

- AUTH-R1 Staff log in with registered Mobile No. + Password; patients with mobile (or email if international) + password.
- AUTH-R2 Landing page by role/permission: Firm Admin / MD -> Firm Admin Dashboard; other staff -> Appointment Calendar if permitted, else welcome page; patient -> Patient Dashboard.
- AUTH-R3 Inactive user, inactive firm -> login blocked.
- AUTH-R4 Patient portal accessible only after receptionist shares credentials; self-registration alone does not grant access.
- AUTH-R5 Forgot Password (OTP): patient enters mobile, staff enters email (?); OTP valid within a window; new + confirm password.
- AUTH-R6 Password policy: >= 8 chars, upper, lower, number, special char (forgot + change password).
- AUTH-R7 Change Password requires current password, new, confirm.
- AUTH-R8 Auto logout after 40 min inactivity -> login page.
- AUTH-R9 Single session: logging in from another device/screen logs out the previous one ("You are logged in from another screen"; API status 10010).
- AUTH-R10 Firm Admin first login: Subscription Terms & Policies modal; "I Agree" enabled only when checkbox ticked; "Cancel" logs out; once per Firm Admin; other roles never see it.
- AUTH-R11 Patient not logged in > 90 days -> OTP verification required; success resets the counter.
- AUTH-R12 Staff not logged in > 30 days -> extra verification (OTP to mobile or email link).
- AUTH-R13 Any user not logged in for 30 days -> Firm Admin gets email + in-app notification.
- AUTH-R14 Logout clears selected branch / cached branch context.
- AUTH-R15 Invalid credentials (confirmed in QA app): a dismissible alert (`role="alert"`, close button) "Invalid Mobile No. Or Password." appears above the form; the user stays on `/staff-login`; the mobile number is kept, the password is cleared. The mobile field is an international phone widget (country selector, default India +91) that re-formats the typed number for display (e.g. `088888 88888`) but submits `8888888888`.

## FIRM - Super Admin: Firms, Branches, Firm Settings

Screens: Firms list, Add/Edit Firm (Firm Details, Firm Admin Details, Customization, Allotted Users / User Restrictions), Firm View (3 URLs with copy icons).

- FIRM-R1 Required firm data: Firm Name, Name on App, unique Sub-Domain, Logo (JPG/JPEG/PNG), branches (main branch mandatory), GST, PAN, contact, country (India default), address, email; Firm Admin name, password, mobile (Indian), email.
- FIRM-R2 Sub-domain unique and locked after creation (no UI edit).
- FIRM-R3 Creation provisions DB, migrations, seeders (masters, rate cards, sessions, permissions), system user, firm admin, and 3 URLs.
- FIRM-R4 Firm Unique ID = first word of Name on App + PAN.
- FIRM-R5 Firms list: search by name / sub-domain / admin; Active / Inactive toggle; inactive firm cannot log in.
- FIRM-R6 Exactly one Main Branch at a time (toggle can move it); branch Active / Inactive.
- FIRM-R7 Inactive branch: only View and Export; no create / edit of patients, appointments, consultations, invoices.
- FIRM-R8 Branch delete only with zero dependencies (no active patients, appointments, consultations, pending records).
- FIRM-R9 Customization: Shadow Consultant Yes/No (default Yes); Pediatric module checkbox + post-subscription remaining days.
- FIRM-R10 User Restrictions: total user count + per-role limits (Accountant, MD, Consultant, Receptionist, Staff); sum of role limits must not exceed total ("Role limits exceed total user count. Please adjust the values.").
- FIRM-R11 Reducing a role limit below current users is blocked ("<n> Medical Directors are already registered...").
- FIRM-R12 Firm-management screens invisible to other firms' staff.

## USER - User Management

Screens: Users list, Add / Edit User.

- USER-R1 Fields: first/last name, email (unique in firm), mobile (unique in firm), password, branch, role per branch, gender, DOB (optional), photo (JPG/JPEG/PNG <= 2 MB), degree, specialities (doctors), practice days & time slots, supporting documents, Active/Inactive.
- USER-R2 Inactive user cannot log in; history (notes, Rx) preserved; patients can be reassigned; that doctor's appointments cancelled and re-booked manually.
- USER-R3 Shadow Consultants multi-select (with Select All) shown only for MD / Consultant roles and only when firm Shadow Consultant = Yes.
- USER-R4 Time slot replication: "Replicate Start Time" / "Replicate End Time" copy the first selected day's times to other selected days; per-day override allowed.
- USER-R5 Role user limits enforced on create: "User count for Consultant role is restricted..." and Save disabled.

## ACL - Role & Access Management

Screens: Access Management -> Roles (Add / Edit role, Permissions tab), Consultation tab permissions, Plan billing permissions, Remit Note permissions, Vaccination permissions.

- ACL-R1 Permission keys per module/action (e.g. `view_patient`, `Generate Invoice`, `Apply Discount > 10%`); fetched on login.
- ACL-R2 Missing permission: frontend shows Access Denied page; backend middleware blocks the request.
- ACL-R3 Roles are created per branch; non-admin users can only configure roles for branches they are authorised for.
- ACL-R4 Discount > 10% permission: default Firm Admin and MD; can be granted to others (e.g. Accountant).
- ACL-R5 Consultation page-wise access: Session, Plan, Kriti tabs individually enabled/disabled per role/user; restricted tabs hidden.
- ACL-R6 Plan billing permissions: Cost Per Sub-Session, Total Accepted Sub-Session Cost, Grand Total Plan Cost, Net Total, Plan Discount - no view => hidden / `***`; no edit => read-only.
- ACL-R7 Remit Note: View and Edit permissions; Edit requires View; view-only users see disabled three-dot menu with tooltip "You do not have permission to edit remit notes."; MD always full edit.
- ACL-R8 Leave and Holiday management menus hidden/disabled without permission.
- ACL-R9 Branch scope: Super Admin all firms/branches; HO Admin all branches of the firm; Doctor/Staff own branch only.

## MST - Master Data

Screens under Masters: Sessions, Sub-Sessions, Rate Card, Drugs, Conditions, Provisional Diagnosis, Chief Complaints, Flags, Allergies, Types of Investigations, Lookup & Template Lookup, Template Masters, Exercises, Districts/States, Patient Tags, (Pediatric) Marketed By, Vendors, Brands, Vaccines, Vaccine Inventory.

- MST-R1 Session name unique within firm (duplicates blocked); list shows Sub-Session Count, Last Updated By / Date.
- MST-R2 Sub-session: parent session, unique name, code, cost, duration (drives calendar slot end time), Applicable for Billing Yes/No (No => in plan but not billed), instructions for consultants / patients / admin, attachments.
- MST-R3 Rate Card: name + cost (INR); bulk import branch-wise; 6 predefined rate cards cannot be deleted; billing uses the appointment branch's rate card, falls back to main branch.
- MST-R4 Drugs: name, generic name, instruction, type, default frequency / note / duration; bulk import & export; selecting a drug in Rx auto-fills these defaults (overridable).
- MST-R5 Conditions, Provisional Diagnosis: unique names; bulk import & export.
- MST-R6 Chief Complaints master: "Frequently Used" marking / priority drives the 5 quick suggestions.
- MST-R7 Districts: state + district; India country/states/districts seeded.
- MST-R8 Patient Tags: name, colour, description.
- MST-R9 Templates (History, Investigations Advised, Clinical Note, Prescription Medicine) power auto-populate on the consultation screen. Global (HO) templates: prescription, invoice formats, report layouts; branch templates: header/footer, local language, disclaimers.

## PAT - Patients (Enquiry, Registration, Listing, Tags, Transfer)

Screens: Patient Enquiry, Add Patient / Patient Registration (also public Registration URL), Patient Listing, Patient detail / profile, Patient Transfer requests.

- PAT-R1 Registration channels: receptionist, patient via Registration URL, enquiry converted from the appointment modal.
- PAT-R2 Mandatory: First Name, Last Name, Mobile (unique in firm, Indian), WhatsApp No., Gender, DOB; Email required for international patients.
- PAT-R3 WhatsApp No. auto-filled from Mobile No., editable.
- PAT-R4 Area dropdown populated from selected City (API).
- PAT-R5 Branch auto-selected from the registration link's branch, changeable.
- PAT-R6 Send Notification toggle on by default; unsubscribe only via receptionist; login-related notifications always sent.
- PAT-R7 Photo optional, JPG/JPEG/PNG <= 2 MB.
- PAT-R8 Registration ID auto-generated (format in overview) and unique.
- PAT-R9 Mobile change by receptionist confirmed by OTP to the new number.
- PAT-R10 Pediatric toggle: Mother/Father name, birth weight, father height, relation, WhatsApp mandatory; Apply Vaccination Chart Yes/No.
- PAT-R11 Referral patients: Referred By, email, mobile visible to Receptionist, Firm Admin, MD, Accountant.
- PAT-R12 Listing: export Excel, import Excel (sample template from popup), Send/Resend Login Credentials (SMS/WhatsApp/Email), search by name / mobile / Registration ID / referring consultant, Branch column + filter; clicking name opens appointment history.
- PAT-R13 Tags assigned on profile / consultation; shown on Patient List, calendar/queue, consultation header; tag add/remove logged in Patient File History.
- PAT-R14 Cross-branch history: receiving branch raises transfer request (Pending -> Approved / Rejected); history visible only after approval; patient with an active Plan cannot be transferred (plan must be Stopped).

## APT - Appointments & Calendar

Screens: Appointment Calendar (Day default, Week, Month, List), Consultant list side panel, Add Appointment modal, Appointment View modal, Appointment List.

- APT-R1 Booking: click slot -> modal pre-fills date/time/consultant; enter mobile -> auto-fills patient name, previous/upcoming appointments, dues.
- APT-R2 No past-dated appointments.
- APT-R3 Slots outside consultant practice timing shown grey; validation "Consultant is not available at this time..." (?) booking may still be allowed.
- APT-R4 Each consultant has a unique colour; side panel shows active consultants with today's count; MDs always at top; info icon explains indicators.
- APT-R5 Types: First Consultation (once per lifetime, partial payment), Follow-Up (free within 4 days, chargeable from day 5, cannot check out without payment), New Consultation (new condition or > 2 months after previous; partial payment), Plan Appointment (one per plan sub-session), Dummy (free, no payment step, kept in Patient File). Pediatric "Vaccination Visit" type (?).
- APT-R6 Edit / reschedule / cancel only until check-in; check-in only on appointment day.
- APT-R7 Reschedule notifies patient (if notifications enabled); cancel requires a reason and frees the slot.
- APT-R8 Status indicators: Waiting, Engaged, Checked Out, Cancelled, No-Show; History Doctor indicator.
- APT-R9 Before 2 PM / After 2 PM / Today filters with counts (at or after 14:00 = After).
- APT-R10 Holidays marked on calendar; booking on holiday dates blocked (?) ; existing appointments on a new holiday trigger reschedule/cancel notification.
- APT-R11 Leave: consultant can apply leave only after rescheduling appointments in that period.
- APT-R12 "Consultation Start" button on Add Appointment for the assigned consultant, their shadow, or MD - marks Engaged and opens consultation.
- APT-R13 Shadow consultants see the primary consultant's appointments (calendar + list) and can start them.
- APT-R14 Appointment List: Branch column and filter; action column for Collect Payment, invoice, view.

## PAY - Payments & Discounts (at booking / appointment)

- PAY-R1 Payment fields: Date (default today), Mode (Cash, Card, UPI, Cheque, Bank Transfer), Amount, Purpose (auto from type: First / Follow-Up / New / Plan / Kriti Extension), Discount.
- PAY-R2 Partial payment allowed for First / Follow-Up / New Consultation and Plan.
- PAY-R3 Collect Payment also from Appointment List action column and Appointment View modal; allowed regardless of consultation status.
- PAY-R4 Discount cap 10% unless Firm Admin / MD / discount permission (fixed or percentage on plans).

## QUE - Patient Queue

- QUE-R1 Queues: Pending, Waiting / Today, Engaged, Done; Before/After 2 PM split.
- QUE-R2 Flags: Waiting = blue; Engaged = orange; Done but not checked out = orange in Done queue; Done + checked out = green.
- QUE-R3 Order by actual check-in timestamp (first-come first-served), maintained across reschedules; remaining Waiting patients move up.
- QUE-R4 Clicking a patient in the Engaged queue opens the consultation directly (assigned consultant, shadow, MD only; role based); Waiting/Today still need "Start Consultation".
- QUE-R5 Dashboard Quick Access to queue for MD and Consultant.

## CON - Consultation (Add Consultation screen, Consultation tab, Rx)

Opened from calendar (patient name after Engaged), Appointment List eye icon, Engaged queue, Consultation Start button.

- CON-R1 Tabs by appointment type: Consultation tab only for First / New / Follow-Up; Calendar, Plan, Session, Procedure, Kriti, Patient File History, Board always; Sub-Session Note only for Plan appointments; Vaccination Chart for pediatric patients with chart enabled.
- CON-R2 Sections: Vitals, Chief Complaints, Patient History (template + version history + attachments), Investigations (template; completed only when attachment uploaded), Clinical Notes (template, attachments, visible to all doctors on the patient's sub-sessions), Provisional Diagnosis, Rx, Additional Information.
- CON-R3 Returning patients: Flag, Allergies, Relationship Status, Chief Complaints auto-filled.
- CON-R4 Submit -> status Done; Done auto-checks-out (?); status field hidden after Done; edit window 24 h for consultant, MD afterwards.
- CON-R5 Rx: drug (master), frequency, duration, note; Auto Populate from Prescription Medicine Template; drug selection auto-fills defaults.
- CON-R6 Duplicates blocked within one consultation: drugs ("This drug is already added to the prescription..."), investigations ("This investigation is already added."), Kriti ("This Kriti exercise is already assigned."); templates de-duplicated with notice ("Duplicate drugs in template were removed."). Same items allowed in other consultations.
- CON-R7 Rx share / print: email & WhatsApp auto-filled; choose included sections; status becomes Shared / Printed; Print button top-right.
- CON-R8 Rx language: English (default), Marathi, Hindi, Kannada, Gujarati, Telugu; Advice & Instructions translated dynamically (API); Frequency, Duration, Note, Next Visit static translations.
- CON-R9 RX core section (collapsible) vs supplementary fields (Next Visit Reminder, Advice, Prescription Note) always expanded; each supplementary field enabled/disabled at firm level (hidden for all when disabled); side-by-side layout for Prescription Note & Advice.
- CON-R10 Collapsible sections firm toggle: ON shows collapse icons & remembers state in session; OFF all expanded, no icons.
- CON-R11 Instant Action button (firm toggle): Queue, Rx PDF (disabled with "No prescription available." when none), Plan, Session, Kriti, Patient File History.
- CON-R12 Chief Complaints quick suggestions: top 5 buttons; clicked button disabled for this consultation; adds complaint with Duration & Remarks; "Add More" for others.
- CON-R13 Concurrent access lock: second user sees "This consultation is currently being accessed by <name>. Please try again later." and read-only view; lock released on save/close or after 10 min idle ("Your consultation session has expired due to inactivity...").
- CON-R14 Reminder button: "Send Follow-Up Reminder" + Remind After (3 Days, 1 Week, 2 Weeks, 1 Month, 2 Months, 3 Months, 6 Months) -> patient notified on that date.
- CON-R15 Copy Last Prescription: allowed for same consultant or their shadow; blocked for others incl. MD unless original / shadow ("You cannot copy prescriptions from other consultants."); firm without shadow feature -> same consultant only; copies drugs, advice, prescription note; action audited.
- CON-R16 Attachment icons on Plan, Kriti, Procedure, Sessions; formats PDF, JPG, PNG, DOCX, XLSX, audio, video, HEIC; <= 10 MB each; multiple files; visible in Patient File History.
- CON-R17 Shadow consultant can open/act on all consultation tabs for the primary's patients; activity logged under shadow with link to primary.
- CON-R18 Appointment details on consultation show Branch name; Area shown in patient info.

## PLN - Plan Tab

- PLN-R1 Plan built from multiple sessions/sub-sessions; per sub-session: Sessions Given (recommended) and Sessions Accepted.
- PLN-R2 Workflow: create -> Freeze (prevents changes) -> initial status Passive -> assign consultants -> create invoice -> assign schedules -> set status.
- PLN-R3 Tentative End Date = Start Date + max sub-session count + buffered days (configurable); overridable.
- PLN-R4 Hold: end date extended by (hold start date - today).
- PLN-R5 Stop: end date = today; no new sub-session appointments; required before branch transfer.
- PLN-R6 Privilege: dues hidden from patient until privilege date.
- PLN-R7 Carry forward / extension: receptionist shifts dates, patient pays, appointments added under same plan.
- PLN-R8 Plan discount fixed or %, cap 10% unless permitted.
- PLN-R9 Kriti column: Assign Kriti, Kriti Extensions (1 follow-up = 2 months, 2 = 6 months, 4 = 1 year), Extension History.
- PLN-R10 Plans are branch-wise; plan linked to the appointment it was created from (invoice traceability).
- PLN-R11 Billing fields governed by ACL-R6.

## SES - Session Tab

- SES-R1 Assign schedules per sub-session; summary counts Pending, Completed, Scheduled, Cancelled, No-Show, Deleted.
- SES-R2 Plan start/end auto-updated from earliest / latest sub-session appointment.
- SES-R3 Delete a session only after > 3 cancellations / no-shows in the plan; otherwise Delete disabled.
- SES-R4 Consultant dropdown limited to consultants chosen on the Plan tab.
- SES-R5 Play button active only on/after the appointment date.

## PRC - Procedure Tab

- PRC-R1 Primary and Additional procedures; a sub-procedure chosen as Primary is excluded from Additional.
- PRC-R2 Follow-ups added from the same interface; procedure date locked once a follow-up exists.
- PRC-R3 Total Bill and Consultant Share visible only to Admin, MD, Accountant.
- PRC-R4 Microphone voice input (browser speech recognition).

## SSN - Sub-Session Note

- SSN-R1 Visible only for Plan appointments; notes + attachments.
- SSN-R2 Submit marks sub-session Completed; after 24 h only MD can modify.

## KRT - Kriti

- KRT-R1 Exercises allocated per session under a plan; content: positions, steps, breathing, reps/sets, attachments (image, GIF, video, PDF, audio).
- KRT-R2 Patient sees Kriti only after Kriti payment is completed.
- KRT-R3 Default access 5 days after plan end; extendable (PLN-R9); listing hides expired Kriti.
- KRT-R4 Practitioners can modify exercise details after submission.

## PFH - Patient File History

- PFH-R1 Timeline: previous consultations, plans, Kriti, procedures; tags with timestamps; attachments.
- PFH-R2 Filter by consultant, date, branch, appointment type; export whole file as PDF.

## BRD - Board

- BRD-R1 Whiteboard: shared with all users with access to the patient's consultation page.
- BRD-R2 My Note: creator only; Admin & MD see all.
- BRD-R3 Remit Note: Admin, MD, Accountant, Receptionist (?); governed by ACL-R7.
- BRD-R4 Attachments PDF, image, GIF, audio, video; full version history per section.

## ACC - Accounts (Invoices, Receipts, Refunds)

Screens: Accounts / Invoices list, Receipts list, View Receipts modal, invoice print/share.

- ACC-R1 Invoices created from Appointment View modal, Appointment List action column, Plan screen (plans & Kriti extensions); branch-wise; Branch name on every invoice.
- ACC-R2 One invoice per Plan and per Kriti Extension; one item per invoice; plan invoice rows come from plan structure (no manual rows).
- ACC-R3 Invoice cancellable only without active receipts; no delete once amount collected (audit trail).
- ACC-R4 Payment collection triggers patient notification (SMS/WhatsApp/email per firm & patient settings).
- ACC-R5 Receipts list: number, invoice, date, mode, amount, patient, branch; print/share; cancellable only if the linked invoice is not cancelled.
- ACC-R6 Outstanding Paid Receipt maps a payment to previous due invoices; Refund Receipt reflects in payment history.
- ACC-R7 Vaccination invoices: consultation fee + one line per administered vaccine "Vaccination-<Vaccine> (<Brand>)" at sell price; Share (email/WhatsApp) / Print; "With Receipt" checkbox.

## PTL - Patient Portal

- PTL-R1 Dashboard: Today's & Upcoming appointments, Kriti (View All), Outstanding Dues (appointments, plans, Kriti extensions), Plan progress (completed vs pending sessions).
- PTL-R2 Appointments list with status Complete / No-Show / Cancelled; download/share Rx; instructions visible only until Rx downloaded/shared.
- PTL-R3 Plan appointment details: session & sub-session, doctor, sessions done/remaining, plan name, valid till, patient instructions.
- PTL-R4 Plans: name, payment status (Paid/Unpaid/Due), goal, start/end, number of sessions, due amount (hidden under Privilege - PLN-R6).
- PTL-R5 Kritis: plan name, Accessible Till, To Extend Call On; exercises per sub-session with remarks and attachments.
- PTL-R6 Profile view-only; mobile change via receptionist with OTP.

## NTF - Notifications & Communication

- NTF-R1 Triggers: appointment booked / rescheduled / cancelled, reminder, payment confirmation (receipt), plan-day summary, login events (credentials, reset OTP, mobile update OTP, login from another device), Kriti expiry approaching, follow-up reminder (CON-R14), holiday conflicts.
- NTF-R2 Subscribed by default at registration; unsubscribed patients still get login-related notifications.
- NTF-R3 SMS only within India; reminder SMS includes patient name.
- NTF-R4 Team Message Hub: real-time socket-based staff messaging (unread count in header).

## RPT - Reports

- RPT-R1 Excel exports: Consultation, Procedure, Plan, Vaccination reports.
- RPT-R2 Filters per report: date range, consultant, plan status, appointment type, branch, patient; Branch column.

## DSH - Dashboard

- DSH-R1 Widgets: Today's Appointments (consultations, sessions, procedures, dummy), Patient Queue, Today's Collections by mode, Outstanding Amount, Active Plans, Kriti Expirations Today, Quick Links (add patient, book appointment, message). QA app sections: Patients (Total Enquiries, Total Registrations), Accounts (Net Invoice, Receipt, Due), Appointments (Total, First, New, Follow-Up, Plan, Dummy, Before/After 2 PM, Procedures), Users (by role), Procedures/Plans today/tomorrow tables.
- DSH-R2 Filters: date, consultant, branch; no branch filter => consolidated across the user's branches; single-branch users always see their branch.
- DSH-R3 Queue quick access for MD and Consultant.

## LV - Leave Management

- LV-R1 Apply: My Profile -> Leave Management -> Apply; leave type, from/to date, reason.
- LV-R2 Approve/Reject: Firm Admin, MD, designated managers; view all: Firm Admin & HR; policies: Firm Admin.
- LV-R3 Requires "Leave Management" permission (?) ; branch-level leave calendars.
- LV-R4 Consultant must reschedule appointments in the leave period before applying (APT-R11).

## HOL - Holiday Management

- HOL-R1 Settings -> Holiday Management: name, date, type (Public Holiday / Clinic Closure / Special Leave), branches (all / specific); list with edit/delete.
- HOL-R2 Holidays are branch-level and apply only to that branch's calendar.
- HOL-R3 Calendar marks holiday; booking blocked (?) ; existing appointments trigger reschedule/cancel notification; consultants don't see holiday slots as available.
- HOL-R4 Requires "Holiday Management" permission.

## VAC - Vaccination & Inventory (Pediatric)

- VAC-R1 Available only when firm Pediatric module enabled (Super Admin) and patient registered with Apply Vaccination Chart = Yes.
- VAC-R2 Master order: Marketed By -> Vendors (type Vaccination, linked to Marketed By) -> Brands (linked to Marketed By, confirmation dialog) -> Vaccines (details, doses, brands; SKU auto-generated `VACCINE-MARKETEDBY-BRAND`, editable; reorder level).
- VAC-R3 Inventory: vaccine, marketed by, brand (auto), already in stock (read-only), vendor, batch, expiry, near-expiry, SKU, transfer to branch, quantity, purchase rate, amount = qty x rate, additional charge, total cost per unit = rate + additional, MRP, sell price, invoice no/date; stock updates immediately.
- VAC-R4 Vaccination Chart tab: rows = vaccines, columns = age milestones; cell status Due / Administered (date, batch, consultant) / Overdue (red) / Not Applicable / Optional.
- VAC-R5 Administer from a Due cell: brand + batch from inventory -> Administered; inventory decremented by dose quantity.
- VAC-R6 Vaccination permissions View/Add/Edit/Delete per role; without permission tab, masters and invoice lines hidden.

## BR - Branching (cross-cutting)

- BR-R1 Header Branch Selector on every screen; selected branch attached to every request and validated against user's branches; cleared on logout.
- BR-R2 Branch column/filter on: Patient Registration, Add Patient, Patient Listing, Appointments List, consultation appointment details, Patient File, Attachments, Rate Card listing, View Receipts modal, Receipts listing, Reports.
- BR-R3 Logs (activity, data changes, login history) carry Firm ID + Branch ID.
- BR-R4 See also FIRM-R6..R8, PAT-R14, MST-R3, ACC-R1, HOL-R2, LV-R3, ACL-R3, ACL-R9.

## SYS - System-wide

- SYS-R1 Right-click disabled on all screens; Ctrl/Cmd+C, app Download/Print/Save still work.
- SYS-R2 PWA prompt on first visit: "Add Praheal to your home screen for quick access?" with "Yes, Add to Home Screen" / "Not Now" (not shown again that session).
- SYS-R3 Login History and Activity Log screens (profile menu) - details not documented.
