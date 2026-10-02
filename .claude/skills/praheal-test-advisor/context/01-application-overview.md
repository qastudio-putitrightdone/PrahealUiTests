# Praheal - Application Overview

Source: `Praheal_User_Manual_24_09.pdf` (v.01, SplendorNet Technologies) at the project root. Section names in this context refer to that manual.

## What Praheal is

Praheal is a web-based, multi-tenant **Clinic Management System** (SaaS) for hospitals, clinics, polyclinics and multi-branch healthcare groups. It digitises the whole patient journey: enquiry -> registration -> appointment -> consultation -> treatment plan -> sessions / procedures -> billing -> post-treatment exercises (Kriti) -> follow-up, plus internal messaging and SMS / WhatsApp / email notifications.

## Tenancy, firms and branches

- Every **firm** (clinic brand) has its own sub-domain (`<firm>.praheal.com`) and its **own isolated database**. No cross-firm data leakage is allowed.
- `app.praheal.com` - technical team only: first firm, global settings (SMTP, email branding, default SEO).
- Primary firm (`praheal.praheal.com`) - Super Admin creates and manages all other firms.
- Each firm exposes three URLs: **Patient Registration**, **Patient Login**, **Staff Login**.
- A firm has one or more **branches**; exactly one is the **Main Branch**. Branch context is selected in the header Branch Selector and attached to every request; data (dashboard, appointments, patients, billing, reports) is scoped to it.
- Inactive firm -> its staff and patients cannot log in. Inactive branch -> only View and Export allowed for its data.

## Test environment (QA)

- URL: `https://prahealqa.medojus.com` (firm "Prahealqa"); staff login page `/staff-login`; admin dashboard `/admin/dashboard`.
- API base `/backend/api/`, multipart requests, HTTP always 200 - outcome in `status_code` (1 success, 101 invalid credentials, 401 no token, 10010 logged in from another screen).
- Branches seen in QA: Aundh (main/active), Koregaon Park (inactive), Prahealqa 4, Sinhagad 1 Road Multispeciality Clinic, test, Viman Nagar.
- Test account `user/Users.ts` `SUPER_ADMIN` (8888888888) is labelled **Medical Director** in the app header - confirm the real role before relying on Super-Admin-only behaviour.
- Only one active session per user: parallel tests with the same user can log each other out.

## Roles

| Role | Purpose | Lands on after login | Notes |
|---|---|---|---|
| Super Admin | Platform team / authorised primary-firm staff: create, edit, (de)activate firms, branches, user limits, firm modules (Pediatric, Shadow Consultant) | Firms list | Cannot see any firm's clinical data |
| HO / Firm Admin | Highest privilege inside one firm: users, roles & permissions, masters, settings, holidays | Firm Admin Dashboard | Must accept Subscription Terms on first login. Access to all branches of the firm |
| Medical Director (MD) | Senior doctor with admin-equivalent privileges in clinical modules | Firm Admin Dashboard | Not bound by 10% discount cap; can edit consultations / sub-session notes after 24 h; always full Remit Note edit |
| Doctor / Consultant | Consultations, plans, sessions, procedures, Kriti | Appointment Calendar (if permitted, else welcome page) | Own branch only; may have shadow consultants |
| Receptionist | Enquiries, registration, booking, payments, plan hold/extension/cancel | Appointment Calendar (if permitted) | Discount max 10% |
| Accountant | Invoices, receipts, refunds, outstanding, financial reports | Per permissions | Sees Total Bill / Consultant Share; discount max 10% unless granted |
| Patient | Portal: appointments, plans, dues, Rx, Kriti, profile | Patient Dashboard | Access only after receptionist shares credentials; mobile login (email for international) |

Access is permission-key based (e.g. `view_patient`), checked on the frontend (Access Denied page) and the backend (middleware blocks the request). Roles are defined **per branch**.

## Global constraints (apply to every module)

- English UI only. No guest access - every action requires authentication.
- Staff and patient login by mobile number; international patients by email. Indian mobile numbers only (current scope).
- Password policy: min 8 chars, upper + lower case, number, special character.
- Auto logout after **40 min inactivity**; logging in elsewhere logs the previous screen out ("You are logged in from another screen").
- Consultation / sub-session note editable by the consultant for **24 h** after submission; afterwards only the Medical Director.
- Discount up to **10%** for receptionists and others; above 10% needs Firm Admin / MD or explicit discount permission.
- SMS only for patients in India; others get WhatsApp + email only. Reminder SMS includes the patient name.
- Past-dated appointments cannot be created. Check-in only on the appointment day.
- Right-click context menu disabled everywhere (keyboard copy, app Download / Print / Save still work).
- Attachments: images JPG/JPEG/PNG (profile photos up to 2 MB); consultation attachments PDF, JPG, PNG, DOCX, XLSX, audio, video, HEIC up to 10 MB each.

## Glossary

- **Session** - category of treatment (Yoga, Physiotherapy, ...). **Sub-Session** - schedulable unit under a session with code, cost, duration, billing flag and instructions.
- **Plan** - treatment plan combining sessions / sub-sessions; statuses Passive (initial), Active, Hold, Stop, Privilege.
- **Kriti** - post-treatment exercise programme (Activities & Advice) delivered to the patient portal; default access 5 days after plan end; extensions 2 / 6 / 12 months.
- **Procedure** - Primary and Additional procedures with follow-ups.
- **Board** - Whiteboard (shared), My Note (private; Admin / MD see all), Remit Note (finance / reception notes; permission-controlled).
- **Shadow Consultant** - consultant who can see and act on another consultant's / MD's appointments and consultations.
- **Rx** - prescription; shareable / printable PDF, translatable (English, Marathi, Hindi, Kannada, Gujarati, Telugu).
- **Rate Card** - predefined price tag; branch-wise; 6 predefined cannot be deleted.
- **Registration ID** - `<2 initials of Name on App><Branch Code><MM><YYYY><monthly seq><day without leading zero>`, e.g. `SPAU0520242301`.
- **Firm Unique ID** - `<first word of Name on App> + <PAN>`.
- **Privilege** - plan status hiding outstanding dues from the patient until a date.
- **Dummy appointment** - free slot for a quick investigation / Rx update; no payment step.
