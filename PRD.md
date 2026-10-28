# Polyclinic Queue System PRD

Oct 28, 2026 · @D4MAY

A web-based queue and patient registration system for one polyclinic in one clinic, built on free-tier hosting with a daily manual encrypted backup.

## Summary and goals

The system runs queues and registration for one polyclinic in one clinic: five doctors, at most two on duty per day. It runs on free hosting and keeps an encrypted backup of the data.

- Patients book, check in and see their queue number without waiting at the desk.
- Front desk and clinical staff run the day's queue in real time, and the waiting-room TVs show the same numbers.
- Management gets accurate daily and monthly reports.

## Scope

**In scope, version one**

- Online booking, cancellation and rescheduling with login
- Walk-in registration and check-in by the front desk
- Queue numbers per doctor, shown on TVs, the front-desk PC and the nurse tablet
- Quick triage, emergency walk-ins and referral letter printing
- Daily and monthly reports

**Out of scope, version one**

- Full EMR, lab results and pharmacy
- Billing, payments, deposits and no-show fees
- BPJS or insurance verification
- WhatsApp and SMS notifications
- Transport booking or ambulance dispatch

**Prepared for later, designed now**

- More clinics: a clinic ID on every record
- More polyclinics and doctors beyond five
- A billing link
- Connections to other systems through an API layer
- Automated backup through GitHub Actions

## Users and roles

| Role | Who | Can do | Cannot do |
| --- | --- | --- | --- |
| Patient | Patient with an own account | Book, cancel, reschedule, check in, see own queue number | See other patients or staff screens |
| Guest | Visitor, not logged in | View schedule, slot availability, live numbers without names, FAQ | Book, or see any personal data |
| Front desk | Receptionist | Register walk-ins, check in, quick triage, flag priority with a reason, print tickets and referral letters, edit schedules when delegated | Edit master data or accounts |
| Doctor or nurse | Clinical staff | Call, recall, skip and finish visits; mark self unavailable; doctor approves referrals; nurse refers under set criteria | Master data, accounts, reports beyond own visits |
| Super Admin (IT Admin) | IT staff | Master data, accounts, schedule delegation, duplicate merge, backups, audit log, all reports | Routine clinical actions; any medical-note access is logged |

## Main workflow

1. Patient registers or logs in with phone number and OTP.
2. Patient chooses a doctor, a date and a time slot, and gets an appointment code and web reminders.
3. On the day, the patient checks in by QR code, app tap or at the front desk. The system issues a queue number, for example A-012.
4. The queue updates in under 2 seconds on the front-desk PC, nurse tablet and waiting-room TVs.
5. The doctor or nurse calls the next number, and the patient gets a web notification.
6. The consultation ends with Finish, which logs timestamps.
7. The visit feeds the daily report.

**Walk-in path, in parallel:** the front desk searches for the patient, registers them if new, checks them in and prints a ticket. The number joins the same queue as online patients.

## Queue rules

- **Numbering:** one number line per doctor, such as A-001 and A-002 for doctor A. A number is issued at check-in, never at booking.
- **Ordering:** appointments by slot time, with a 15-minute grace period. Walk-ins by arrival time. Priority patients move forward.
- **Status:** Booked, Checked in, Waiting, Called, Done. Side states: Cancelled, Skipped, No-show, Not served, Doctor unavailable.
- **Calls:** a number is called up to 3 times, then marked Skipped. One re-entry at the end of the queue within 30 minutes; otherwise No-show.
- **Priority:** elderly, pregnant or urgent. Only staff set it, with a reason. Every use is logged.
- **Corrections:** the doctor or nurse can Recall a patient or Undo the last call. Cancelling after check-in is front-desk only.

## Accounts and duplicates

- **Registration:** phone number and OTP. Name and date of birth required. NIK optional but recommended.
- **Login and reset:** phone number and OTP. Password reset by OTP.
- **Families:** one account can hold several patient profiles, such as a child and a parent.
- **Prevention:** phone and NIK must be unique. Before saving, the system shows likely matches with "Is this you?"
- **Walk-in search:** staff search by phone, NIK, or name and date of birth before "Create patient" appears.
- **Detection:** a scheduled check adds likely duplicates to a review list.
- **Merge:** Super Admin only. The primary record is kept, the other is marked Merged, and nothing is deleted. Every merge is logged.
- **Emergency records:** a temporary ID, such as TMP-0042, is completed and merged once the patient is stable.

## Cancellations, doctor unavailable and operating hours

- **Cancellation:** online until 2 hours before the slot. The slot is released at once, the waitlist is notified, and the record is kept.
- **Reschedule:** cancel and rebook in one step, so the patient never loses a place by accident.
- **Doctor unavailable:** a separate status, not Cancelled or No-show. The patient is notified on web at once.
- **Rebooking options:** the next session with priority, another doctor, or cancellation with no penalty. The patient keeps their order.
- **Affected list:** the front desk sees each patient's reply. No reply means a phone call. A held slot expires after 24 hours.
- **Schedule change lock:** editing a session with bookings shows "N patients affected" and must be resolved first.
- **Slots:** they follow duty schedules only, with a holiday calendar and a 30-day booking horizon.
- **Closing:** the check-in window opens 60 minutes before the session. Patients not served at closing are marked Not served and rebooked with priority.
- **After hours:** the queue page shows "Clinic closed, opens at [time]". Booking stays online.

The 2-hour, 60-minute, 24-hour and 30-day values are proposals to confirm.

## Emergency and referral

The clinic treats life-threatening cases as far as it can. When a patient needs care beyond its capacity, it refers the patient to a hospital.

**Emergency walk-in**

1. Front desk runs a short triage checklist: emergency, urgent or routine.
2. An alert goes to the nurse tablet and the doctor's screen.
3. Quick registration: name or "Unknown", approximate age, sex, complaint and a companion's phone number. A temporary ID is issued. Target: under 60 seconds.
4. Urgent patients go to the top of the queue, and check-in is skipped.
5. Online patients book normally. The booking page warns: "If this is an emergency, go to the nearest ER or call for help."

**Referral rules**

- **Standard (option A):** the nurse starts the referral, the doctor approves it on the tablet, and the system records the reason and destination and prints the letter.
- **Nurse-initiated (option C):** only when a clinical criterion is met, such as the patient being in immediate danger. The clinical lead writes the list. The doctor is notified at once and must confirm within a set time.
- **Referral letter (printed):** name, relevant illness record, allergies, reason, destination, time and approving doctor. Only fields the receiving hospital needs. Each print is logged.
- **Transport:** none for now. The system records the referral and when the patient left. Staff arrange transport outside the system until a partner is added.
- **Daily report:** referral counts and reasons only, such as "chest pain, referred, 10:40". Full notes stay in the patient record.

## Guest view and notifications

**Guests see:** clinic information and hours, doctor schedules, slot availability, the current number per doctor (no names), FAQ, notices and a "Last updated" time.

**Guests cannot see or do:** patient names, phone numbers or history; booking; reports.

**Login redirect:** after login, the patient returns to the slot they picked.

**Notifications, web only:** booking confirmation, H-1 reminder, "your turn is near", doctor-unavailable notice and cancellation confirmation. No WhatsApp or SMS.

Web notifications reach only patients who allow them. Others rely on the TV and staff calls, so missed calls are expected.

## Hardware and screens

| Device | Use | Requirements |
| --- | --- | --- |
| Front-desk PC | Check-in, walk-ins, queue control, printing | Current browser, internet connection, connected to the waiting-room TVs |
| Nurse or doctor tablet | Confirm, call, finish, approve referral | Current browser, touch targets 44 px or larger |
| Waiting-room TV | Live queue: current number per doctor | Standard hospital-grade TV, 1920 × 1080 design for any screen, full-screen browser. Shows "Reconnecting" on signal loss, never a blank screen |
| Small printer | Referral letter, walk-in ticket | Office printer. If it fails, staff reissue the ticket by hand and log it |

The LG LN572M is 1366 × 768. The layout must scale to it, and one real TV must be tested before launch. Numbers on the TV must be large enough to read across the waiting room.

## Non-functional requirements

- **Performance:** queue updates reach every screen in under 2 seconds. Page load is under 2 seconds at the agreed load, which is still to be measured.
- **Overload:** when too many users open the queue page at once, the system returns an HTTP error. TVs and the front-desk screen use a separate, lightweight feed and keep showing the last numbers with their time.
- **Availability:** best effort on free tiers, with no SLA. The paid-tier target is 99.9%.
- **Backup:** a daily manual export by the IT Admin, encrypted, stored in a separate Google Drive account under a different email. A scheduled GitHub Actions job is planned later. Recovery point: up to one day. One restore is tested before go-live.
- **Security and privacy:** UU PDP No. 27/2022. Database in a Singapore region. HTTPS. Encryption at rest. Access rules enforced in the database. Audit log for patient-data access and changes. Consent at registration, including emergency care. Retention period to confirm.
- **Offline:** patients' last-loaded schedule and number stay cached. The front desk buffers check-ins and syncs when back online. Paper tickets are the fallback, and back-entry is logged.
- **Language and access:** Bahasa Indonesia. Large text. Touch targets 44 px or larger.

## Platform and budget

The stack uses free tiers only: Supabase for database, login and live updates; Vercel for the web app; GitHub for code and the later backup job; Google Drive for backup copies.

| Risk accepted | Effect | Mitigation |
| --- | --- | --- |
| Vercel Hobby plan is for non-commercial use | Site could be suspended, stopping the system | Owner accepted. Check terms again; move host if needed |
| Supabase free projects pause when inactive | Queue offline | Keep the project active on clinic days. Paper queue as fallback |
| Supabase free has no automatic backups | Data loss | Daily manual encrypted export |
| No SLA on free tiers | Uptime not guaranteed | Move to paid tiers when budget allows |

Free-tier limits and terms change. Recheck them before go-live.

## Reports

**Daily report:** visits per doctor; queue numbers issued; online and walk-in split; average waiting time; no-shows; cancellations; doctor-unavailable count; urgent cases; referrals as counts and reasons; patients not served at closing.

**Monthly report:** the same totals, plus trends, no-show and cancellation rates, and average waiting time per doctor.

- **Formats:** PDF and Excel export without errors.
- **Accuracy:** report totals must match the raw queue data.
- **Access:** front desk sees the daily report. Super Admin sees all reports.

## Release criteria

1. A patient registers with OTP, logs in, and books, cancels and reschedules.
2. Check-in issues numbers by the rules, and walk-ins join the same queue.
3. Queue changes reach the nurse tablet, front desk and TVs in under 2 seconds.
4. An urgent patient appears at the top within 2 seconds. Quick registration takes under 60 seconds. Only staff can set Urgent.
5. A schedule change with bookings shows the affected list. Notices go out on web. No number is issued for an unavailable doctor.
6. Doctor approval is recorded. A nurse-initiated referral notifies the doctor at once. The letter prints.
7. Access rules are tested for every role. Patients cannot read other patients' data.
8. Daily and monthly reports export to PDF and Excel, and totals match the raw queue data.
9. One backup is made and one restore from the encrypted file is tested.
10. Under overload, the queue page returns an HTTP error, and TVs keep showing the last numbers.
11. The front desk, a doctor and the IT Admin sign off user acceptance testing.

## Open items

These must be settled before build or go-live. Each has an owner.

| Item | Why it matters | Owner | Status |
| --- | --- | --- | --- |
| Clinical criteria for nurse-initiated referral | Sets option C | Clinical lead | Open |
| Referral time limit and letter validity | Policy for the letter | Clinical lead | Open |
| Transport partner | No vehicle; referrals depend on it | Clinic management | Open |
| Referral letter template and BPJS number | Letter content | Front desk and clinical lead | Open |
| Daily backup owner and where the key is kept | Recovery | IT Admin | Open |
| TV test on the real screen | Display layout | IT Admin | Open |
| Load target: patients per day and peak users | Load test, hosting | Owner | Open. Planning range 40 to 100 a day |
| Privacy and legal review: UU PDP, hosting region, emergency consent | Compliance | Owner and legal adviser | Open |
| Vercel commercial-use terms | Suspension risk | Owner | Accepted. Recheck |
| Data retention period | Policy | Owner | Open |
| Consultation length per doctor | Queue timing | Doctor | Open |
| Doctor schedule delegation rules | Who edits what | Owner | Decided. Confirm rules |
| Queue structure: one line per doctor | Numbering and display | Owner | Proposed. Confirm |

Sources: the planning figures come from the research report, Indonesian polyclinic patient volume, delivered in this conversation.
