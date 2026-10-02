# Praheal - Open Questions, Contradictions and Documentation Gaps

Do not write assertions that pick one side of a contradiction. Confirm the actual behaviour (product owner, or explore the QA app with Playwright MCP) and record the answer here, then update the rule in `02-modules-and-rules.md` and remove its (?) marker.

## Contradictions in the manual

| # | Topic | Statement A | Statement B | Affects |
|---|---|---|---|---|
| Q1 | Booking on holidays | "Receptionists and patients cannot book appointments on holiday dates." (Holiday - Impact on Appointment Calendar) | "On a holiday appointments can book." (Viewing and Managing Holidays) | APT-R10, HOL-R3, APT-15 |
| Q2 | Booking outside practice hours | Validation "Consultant is not available at this time..." prevents booking errors | "...but Appointment can be booked." (Time Slot Impact) | APT-R3, APT-05 |
| Q3 | Done vs checkout | "Marking the status as Done automatically checks the patient out" (Consultation tab) | "Done (Orange Flag) - Consultation is completed but patient is NOT checked out" (Queue 15.1) | CON-R4, QUE-R2, QUE-04 |
| Q4 | Staff login identity | Staff login by Mobile No. (Login, Constraints) | "Email Address - unique within the firm; used as the staff login ID" (User Management) | AUTH-R1, USER-R1 |
| Q5 | Forgot password identity | Staff enter Email Address | Staff log in with mobile; users' mobile "used for OTP-based password reset" | AUTH-R5 |
| Q6 | Leave access | "Apply for Leave - All staff members have this permission by default" | "Users can only apply for leave if their role has been granted the Leave Management permission" | LV-R3 |
| Q7 | Remit Note visibility | Visible to Admin, MD, Accountant, Receptionist (Board) | Explicit View / Edit permissions; described as MD-to-consultant notes (21.2) | BRD-R3, ACL-R7 |
| Q8 | Discount for Accountant | Accountant limited to 10% unless granted (Discount Allocation) | Firm Admin "can extend this permission ... such as the Accountant" | PAY-R4 (consistent if default = not granted; confirm default) |
| Q9 | Engaged-queue access | "Only the assigned consultant, their shadow consultants, and the Medical Director" | "it is role based not accessed based" | QUE-R4 |
| Q10 | Super Admin location | Super Admin works from primary firm `praheal.praheal.com` | Pediatric enablement "Log in as Super Admin at app.praheal.com" | FIRM-R9 |
| Q11 | Firm Admin landing | Firm Admin / MD land on Firm Admin Dashboard | QA test user labelled Medical Director lands on `/admin/dashboard` - consistent; confirm what Super Admin sees | AUTH-R2 |
| Q12 | Appointment types | Five types (First, Follow-Up, New, Plan, Dummy); Investigation type "future release" | Pediatric booking lists "Vaccination Visit" type | APT-R5 |
| Q13 | Follow-up window | Free within 4 days; chargeable from day 5 | New Consultation if return "after 2 months" from previous Follow-Up vs from previous consultation | APT-R5 (define day 0 and the reference visit) |
| Q14 | Kriti visibility | Patient sees Kriti only after Kriti payment | Default access 5 days after plan end (free?) and "Patients receive free Kriti follow-ups" | KRT-R2, KRT-R3 |

## Sections documented only by screenshot (behaviour unknown)

Explore with Playwright MCP before writing tests, then add rules:
- Patient Enquiry (Receptionist module item 1)
- Lookup & Template Lookup, Template Masters, Exercises Master
- Provisional Diagnosis / Chief Complaints / Flags / Allergies / Types of Investigations master screens (fields and validations)
- Global Settings (Super Admin), Firm Settings & Notification Config (Firm Admin item 4)
- Team Message Hub
- Login History, Activity Log, Export Log History screens
- Calendar Tab inside Add Consultation
- Insurance bills (mentioned for Accountant, not described)
- Leave types and leave policy configuration

## Environment facts to keep in mind

- QA test user 8888888888 is shown as "Medical Director" in the header although stored as `SUPER_ADMIN` - Super-Admin-only scenarios (FIRM-*) may not be runnable with it.
- Credentials for Medical Director, Consultant and Receptionist roles are still empty in `user/Users.ts`; role-matrix scenarios need them.
- The app enforces one session per user (status 10010) - role-based scenarios running in parallel need separate accounts per worker.
