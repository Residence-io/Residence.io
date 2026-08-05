# Data and Storage migration

## Current state

Residence.io stores private objects on the API filesystem under `PRIVATE_STORAGE_ROOT`. `PrivateStorageService` accepts PDF, PNG, and JPEG content after magic-byte and size validation, randomizes names as `<owner-uuid>/<object-uuid>.<ext>`, prevents traversal, and stores SHA-256 metadata. Database rows hold object keys for:

- resident documents and profile photographs;
- payment proofs and generated receipt PDFs;
- resident ID-card PDFs;
- staff and worker documents and salary-slip PDFs;
- complaint, maintenance, and announcement attachments.

Vehicle stickers have no dedicated Prisma model, backend generation endpoint, or stored-object lifecycle in the inspected code. They are therefore a current implementation gap, not an object set that can be claimed as migrated.

## Target bucket design

Use private buckets grouped by retention/authorization boundary rather than one public bucket:

| Bucket                 | Content                                           | Primary metadata                                                              |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `resident-private`     | Resident documents and profile photographs        | `resident_document`, `resident.profile_photograph_object_key`                 |
| `finance-private`      | Payment proofs and receipt PDFs                   | `payment_proof`, `receipt`                                                    |
| `workforce-private`    | Staff/worker documents and salary slips           | `staff_document`, `worker_document`, `salary_slip`                            |
| `ticket-private`       | Complaint and maintenance attachments             | complaint/maintenance attachment tables                                       |
| `announcement-private` | Announcement attachments                          | `announcement_attachment`                                                     |
| `generated-private`    | ID cards and any future approved vehicle stickers | `resident_id_card`; a future migration is required before sticker persistence |

Object paths use `<society-id>/<domain>/<owner-id>/<random-uuid>.<ext>`. No path contains resident names, CNIC values, phone numbers, usernames, ticket subjects, or original filenames. Original display names remain sanitized metadata only.

## Metadata authority and integrity

The application table is authoritative for ownership, category, media type, expected size, SHA-256 checksum, status, replacement chain, retention, and uploader. `storage.objects` is authoritative only for object existence and Storage-native metadata.

Every migrated object has a manifest entry containing source object key, target bucket/key, table and row ID, expected size/checksum, copy result, verification timestamp, and safe error classification. The manifest must never contain file contents, signed URLs, identity data, or secrets.

Integrity jobs report four states:

1. metadata and object both exist and checksum/size match;
2. metadata exists but object is missing;
3. object exists without metadata;
4. object exists but checksum/size differs.

State 1 is reconcilable. States 2–4 block domain cutover. Missing objects are not replaced with fabricated files; mark them unavailable, retain metadata, alert authorized administrators, and recover from backup where possible. Orphan objects are quarantined before retention-approved deletion.

## Copy procedure

1. Freeze object mutations for one bounded domain or write new objects to both locations through the existing NestJS storage abstraction while the database remains authoritative.
2. Inventory database references and filesystem objects without exposing names/content.
3. Copy with a controlled offline tool or tightly scoped migration function using service-role credentials outside the browser.
4. Re-read each target object and verify byte count and SHA-256.
5. Reconcile source metadata, source object, target metadata, and target object counts.
6. Shadow-read target objects and compare hashes while continuing to serve from NestJS.
7. Cut reads for the bounded domain behind a feature flag; test authorized download and denial after refresh/reload.
8. Stop dual-write only after a quiet-period reconciliation is clean.
9. Retain the source according to the rollback window; delete only through a separately approved retention operation.

Uploads that succeed in Storage but fail database finalization are placed in a pending prefix with a short expiry. A finalize RPC validates caller, pending upload, owner, media metadata, and expected checksum before inserting metadata and moving/accepting the immutable object. Database commit and external object creation cannot be one PostgreSQL transaction, so reconciliation is mandatory.

## Access and signed URLs

- Buckets remain private. Public buckets are prohibited for all listed content.
- The browser requests access using an authenticated Edge Function or RPC-backed Next.js server action. Authorization is checked against database metadata first.
- Signed URLs are short-lived, single-object, and generated only after owner/permission validation. They are not stored in the database, audit metadata, analytics, or logs.
- A signed URL is a bearer credential: never expose it to another resident, embed it in long-lived HTML, or use it as the persistent object reference.
- Anonymous QR verification returns safe database fields through an RPC; it does not sign or reveal the underlying PDF/photo/document.
- Replacements use new object keys. Archived/revoked metadata cannot obtain a new signed URL except through an explicitly authorized historical-access workflow.

## Upload validation

Preserve current signature validation and add bucket-specific allow-lists, maximum sizes, decompression/image-bomb protection where relevant, filename/header sanitation, and optional malware scanning. Client-declared MIME type and extension are advisory only. The final metadata row records detected type, size, checksum, uploader Auth ID/application account ID, and society.

## Generated documents

### ID cards, receipts, and salary slips

Generate one document per queued job. The Edge Function loads bounded safe data, generates the PDF/QR, uploads to the private bucket, and finalizes metadata through an idempotent RPC. Generation history and revocation remain in PostgreSQL. Deterministic layout, fonts, QR decoding, physical dimensions, and safe verification output require automated and visual tests.

Supabase Edge Functions currently impose memory, CPU, bundle, and wall-clock limits. Single-document `pdf-lib`/QR generation must be benchmarked with maximum permitted logo/photo sizes. If one document cannot reliably stay within limits, this is a technical blocker requiring a managed document-generation service or an approved non-Edge worker; it must not be hidden inside the browser.

### Bulk generation

Never render many PDFs in one Edge invocation. Queue one object per message, use idempotency keys, record progress, and dead-letter repeated failures. A batch becomes complete only after all metadata/object checks reconcile.

### Vehicle stickers

First define the missing backend model, safe verification requirements, retention, and authorization in a future approved phase. S0 does not invent that implementation. If stickers are generated only for immediate printing, specify whether they are ephemeral responses or retained regulated artifacts before choosing Storage.

## Large exports and imports

Small/medium CSV exports use keyset-paginated safe views and stream escaped rows through an Edge Function or transitional Next.js server route. Prevent CSV formula injection for values beginning with `=`, `+`, `-`, `@`, tab, or carriage return. Unbounded exports are prohibited.

Very large exports may exceed Edge limits and are a blocker until chunked queue-to-Storage composition is proven. Large data imports use an operator-run, audited `psql`/COPY process into staging tables, validation, and transactional promotion. They do not run in a browser or single Edge Function and do not require a permanent Node backend.

## Backups and recovery

Backups use Supabase managed database backups/PITR according to the purchased plan plus separately tested Storage object backup/export procedures. Edge Functions do not perform backups. S9 must rehearse restoring database and objects into an isolated project, reconciling manifests, rotating environment-specific credentials, and measuring RPO/RTO.

## Required tests

- Filesystem-to-Storage inventory and checksum reconciliation.
- Missing metadata/object, orphan, mismatch, duplicate, and interrupted-copy recovery.
- Owner, same-society administrator, unauthorized role, another resident, cross-society, suspended user, and anonymous access.
- Path substitution, traversal, MIME spoofing, over-size, malicious filename, overwrite, archive, replacement, retention, and legal hold.
- Signed URL expiry and non-reuse after archive/revocation.
- PDF/photo/QR visual verification and download reload persistence.
- Edge limit benchmarks and queue retry/idempotency tests.
- Secret/service-role absence from browser bundles, logs, metadata, and generated documents.

## Cutover gate

No storage domain cuts over until metadata count, object count, size, checksum, authorization, and reload-persistence reconciliation is clean; missing objects are resolved or formally accepted; rollback reads have been rehearsed; and the source copy remains available for the approved rollback window.
