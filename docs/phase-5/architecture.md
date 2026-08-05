# Phase 5 complaints and maintenance architecture

Phase 5 adds the NestJS `TicketsModule` and permission-aware Next.js administration and resident routes. General complaints and maintenance requests use separate Prisma aggregates, validation, status enums, histories, messages, attachments, and privacy rules while sharing atomic ticket numbering, SLA, audit, outbox, and private-storage foundations.

## Data and privacy

`Complaint` supports standard, restricted, and confidential privacy. Repository queries are society- and owner-scoped; confidential administration access requires `COMPLAINT_SENSITIVE_READ`, is excluded from ordinary search/export, and is audited. Internal messages, internal transition reasons, confidential rating comments, and sensitive attachments are removed from resident responses.

`MaintenanceRequest` preserves worker-assignment and appointment history. Confirmed scheduling records the minimum disclosure field list and consent/policy basis. Identity documents, finances, household data, internal notes, and staff salary information are never part of contact disclosure.

## Workflow and scheduling

Explicit transition maps reject invalid complaint and maintenance state changes. Optimistic versions protect ticket changes. Completion requires a recorded resolution; reopening is limited to 14 days unless an authorized override is supplied. Resident closure records resolution confirmation.

Phase 4 `WorkforceService.findEligible` evaluates category, required skill, status, working hours, leave, service area, and reservations. Assignment preserves prior rows. Appointment creation uses the Phase 4 reservation table and PostgreSQL exclusion constraints; rescheduling cancels the old reservation and creates a new historical appointment.

## SLA and Phase 6 boundary

Effective active policies calculate target response and resolution timestamps. The escalation scan uses unique idempotency keys, escalation records, and outbox events. Submission, assignments, appointments, transitions, resolution, and escalation emit outbox events for Phase 6; notification delivery is not implemented here.

API routes are under `/tickets`. Administration routes include complaints, maintenance, calendar, unassigned work, categories, and service levels. Resident routes provide own-ticket lists, submission, safe details, messages, reopening/closure, and ratings.
