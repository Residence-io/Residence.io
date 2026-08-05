-- =============================================================================
-- Phase S6: Row Level Security + api Views — Workforce & Tickets Modules
-- =============================================================================
-- Covers:
--   Workforce : department, job_title, staff_member, employment_record,
--               staff_status_history, staff_document, staff_id_sequence,
--               salary_structure, salary_period, salary_record, salary_payment,
--               salary_adjustment, salary_slip, salary_slip_sequence
--   Workers   : contractor_company, worker_category, worker_skill,
--               service_worker, worker_skill_assignment, worker_availability,
--               worker_availability_override, worker_schedule_reservation,
--               worker_rate, worker_document, worker_performance_note,
--               worker_status_history, worker_id_sequence
--   Tickets   : complaint_category, maintenance_category, ticket_sequence,
--               complaint, complaint_message, complaint_attachment,
--               complaint_status_history, complaint_administrator_assignment,
--               maintenance_request, maintenance_message, maintenance_attachment,
--               maintenance_status_history, worker_assignment,
--               maintenance_appointment, maintenance_resolution, service_rating,
--               service_level_policy, escalation_record, contact_disclosure_log
--
-- Access model:
--   Admins    : permission-checked (STAFF_MANAGE / WORKER_MANAGE / SALARY_READ
--               / MAINTENANCE_MANAGE)
--   Residents : read own complaints + maintenance requests,
--               RESIDENT_VISIBLE messages only, own ratings
--   NestJS    : service_role bypass (no changes to business logic)
-- =============================================================================

-- ─── PART 1: GRANTs — Workforce tables ───────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON TABLE department                    TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE job_title                     TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE staff_member                  TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE employment_record             TO authenticated;
GRANT SELECT                  ON TABLE staff_status_history          TO authenticated;
GRANT SELECT, INSERT          ON TABLE staff_document                TO authenticated;
GRANT SELECT                  ON TABLE staff_id_sequence             TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE salary_structure              TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE salary_period                 TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE salary_record                 TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE salary_payment                TO authenticated;
GRANT SELECT, INSERT          ON TABLE salary_adjustment             TO authenticated;
GRANT SELECT, INSERT          ON TABLE salary_slip                   TO authenticated;
GRANT SELECT                  ON TABLE salary_slip_sequence          TO authenticated;

-- Workers
GRANT SELECT, INSERT, UPDATE ON TABLE contractor_company            TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE worker_category               TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE worker_skill                  TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE service_worker                TO authenticated;
GRANT SELECT, INSERT, DELETE  ON TABLE worker_skill_assignment       TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE worker_availability           TO authenticated;
GRANT SELECT, INSERT          ON TABLE worker_availability_override  TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE worker_schedule_reservation   TO authenticated;
GRANT SELECT, INSERT          ON TABLE worker_rate                   TO authenticated;
GRANT SELECT, INSERT          ON TABLE worker_document               TO authenticated;
GRANT SELECT, INSERT          ON TABLE worker_performance_note       TO authenticated;
GRANT SELECT                  ON TABLE worker_status_history         TO authenticated;
GRANT SELECT                  ON TABLE worker_id_sequence            TO authenticated;

-- Tickets
GRANT SELECT, INSERT, UPDATE ON TABLE complaint_category            TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE maintenance_category          TO authenticated;
GRANT SELECT                  ON TABLE ticket_sequence               TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE complaint                     TO authenticated;
GRANT SELECT, INSERT          ON TABLE complaint_message             TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE complaint_attachment          TO authenticated;
GRANT SELECT                  ON TABLE complaint_status_history      TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE complaint_administrator_assignment TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE maintenance_request           TO authenticated;
GRANT SELECT, INSERT          ON TABLE maintenance_message           TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE maintenance_attachment        TO authenticated;
GRANT SELECT                  ON TABLE maintenance_status_history    TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE worker_assignment             TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE maintenance_appointment       TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE maintenance_resolution        TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE service_rating                TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE service_level_policy          TO authenticated;
GRANT SELECT                  ON TABLE escalation_record             TO authenticated;
GRANT SELECT                  ON TABLE contact_disclosure_log        TO authenticated;

-- ─── PART 2: RLS — Workforce Setup Tables ────────────────────────────────────

-- department
CREATE POLICY "s6_admin_select_department"
  ON department FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'STAFF_MANAGE'));

CREATE POLICY "s6_admin_write_department"
  ON department FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'STAFF_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'STAFF_MANAGE'));

-- job_title
CREATE POLICY "s6_admin_select_job_title"
  ON job_title FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'STAFF_MANAGE'));

CREATE POLICY "s6_admin_write_job_title"
  ON job_title FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'STAFF_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'STAFF_MANAGE'));

-- ─── PART 3: RLS — Staff Member ───────────────────────────────────────────────

CREATE POLICY "s6_admin_select_staff_member"
  ON staff_member FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'STAFF_MANAGE'));

CREATE POLICY "s6_admin_write_staff_member"
  ON staff_member FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'STAFF_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'STAFF_MANAGE'));

-- employment_record (via staff_id → staff_member.society_id)
CREATE POLICY "s6_admin_select_employment_record"
  ON employment_record FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = employment_record.staff_id
        AND private.has_permission(sm.society_id, 'STAFF_MANAGE')
    )
  );

CREATE POLICY "s6_admin_write_employment_record"
  ON employment_record FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = employment_record.staff_id
        AND private.has_permission(sm.society_id, 'STAFF_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = employment_record.staff_id
        AND private.has_permission(sm.society_id, 'STAFF_MANAGE')
    )
  );

-- staff_status_history
CREATE POLICY "s6_admin_select_staff_status_history"
  ON staff_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = staff_status_history.staff_id
        AND private.has_permission(sm.society_id, 'STAFF_MANAGE')
    )
  );

-- staff_document
CREATE POLICY "s6_admin_select_staff_document"
  ON staff_document FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = staff_document.staff_id
        AND private.has_permission(sm.society_id, 'STAFF_DOCUMENT_READ')
    )
  );

CREATE POLICY "s6_admin_insert_staff_document"
  ON staff_document FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = staff_document.staff_id
        AND private.has_permission(sm.society_id, 'STAFF_DOCUMENT_READ')
    )
  );

-- staff_id_sequence (admin read-only for authenticated)
CREATE POLICY "s6_admin_select_staff_id_sequence"
  ON staff_id_sequence FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'STAFF_MANAGE'));

-- ─── PART 4: RLS — Salary Tables ─────────────────────────────────────────────

-- salary_structure (via staff_id)
CREATE POLICY "s6_admin_salary_structure"
  ON salary_structure FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = salary_structure.staff_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = salary_structure.staff_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  );

-- salary_period (direct society_id)
CREATE POLICY "s6_admin_salary_period"
  ON salary_period FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'SALARY_READ'))
  WITH CHECK(private.has_permission(society_id, 'SALARY_READ'));

-- salary_record (via staff_id → staff_member.society_id)
CREATE POLICY "s6_admin_salary_record"
  ON salary_record FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = salary_record.staff_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_member sm
      WHERE sm.id = salary_record.staff_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  );

-- salary_payment (via salary_record_id)
CREATE POLICY "s6_admin_salary_payment"
  ON salary_payment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salary_record sr
      JOIN staff_member sm ON sm.id = sr.staff_id
      WHERE sr.id = salary_payment.salary_record_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salary_record sr
      JOIN staff_member sm ON sm.id = sr.staff_id
      WHERE sr.id = salary_payment.salary_record_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  );

-- salary_adjustment
CREATE POLICY "s6_admin_salary_adjustment"
  ON salary_adjustment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salary_record sr
      JOIN staff_member sm ON sm.id = sr.staff_id
      WHERE sr.id = salary_adjustment.salary_record_id
        AND private.has_permission(sm.society_id, 'SALARY_PAY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salary_record sr
      JOIN staff_member sm ON sm.id = sr.staff_id
      WHERE sr.id = salary_adjustment.salary_record_id
        AND private.has_permission(sm.society_id, 'SALARY_PAY')
    )
  );

-- salary_slip (strips pdf_object_key + verification_hash in api view)
CREATE POLICY "s6_admin_salary_slip"
  ON salary_slip FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salary_record sr
      JOIN staff_member sm ON sm.id = sr.staff_id
      WHERE sr.id = salary_slip.salary_record_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salary_record sr
      JOIN staff_member sm ON sm.id = sr.staff_id
      WHERE sr.id = salary_slip.salary_record_id
        AND private.has_permission(sm.society_id, 'SALARY_READ')
    )
  );

-- salary_slip_sequence
CREATE POLICY "s6_admin_salary_slip_sequence"
  ON salary_slip_sequence FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'SALARY_READ'));

-- ─── PART 5: RLS — Worker Setup Tables ───────────────────────────────────────

-- contractor_company
CREATE POLICY "s6_admin_contractor_company"
  ON contractor_company FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'WORKER_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'WORKER_MANAGE'));

-- worker_category
CREATE POLICY "s6_admin_worker_category"
  ON worker_category FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'WORKER_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'WORKER_MANAGE'));

-- worker_skill
CREATE POLICY "s6_admin_worker_skill"
  ON worker_skill FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'WORKER_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'WORKER_MANAGE'));

-- ─── PART 6: RLS — Service Worker ────────────────────────────────────────────

CREATE POLICY "s6_admin_service_worker"
  ON service_worker FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'WORKER_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'WORKER_MANAGE'));

-- worker_skill_assignment (via worker_id → service_worker.society_id)
CREATE POLICY "s6_admin_worker_skill_assignment"
  ON worker_skill_assignment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_skill_assignment.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_skill_assignment.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_MANAGE')
    )
  );

-- worker_availability
CREATE POLICY "s6_admin_worker_availability"
  ON worker_availability FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_availability.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_SCHEDULE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_availability.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_SCHEDULE')
    )
  );

-- worker_availability_override
CREATE POLICY "s6_admin_worker_availability_override"
  ON worker_availability_override FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_availability_override.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_SCHEDULE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_availability_override.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_SCHEDULE')
    )
  );

-- worker_schedule_reservation
CREATE POLICY "s6_admin_worker_schedule_reservation"
  ON worker_schedule_reservation FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_schedule_reservation.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_SCHEDULE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_schedule_reservation.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_SCHEDULE')
    )
  );

-- worker_rate
CREATE POLICY "s6_admin_worker_rate"
  ON worker_rate FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_rate.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_rate.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_MANAGE')
    )
  );

-- worker_document
CREATE POLICY "s6_admin_worker_document"
  ON worker_document FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_document.worker_id
        AND private.has_permission(sw.society_id, 'STAFF_DOCUMENT_READ')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_document.worker_id
        AND private.has_permission(sw.society_id, 'STAFF_DOCUMENT_READ')
    )
  );

-- worker_performance_note
CREATE POLICY "s6_admin_worker_performance_note"
  ON worker_performance_note FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_performance_note.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_PERFORMANCE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_performance_note.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_PERFORMANCE')
    )
  );

-- worker_status_history
CREATE POLICY "s6_admin_worker_status_history"
  ON worker_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_worker sw
      WHERE sw.id = worker_status_history.worker_id
        AND private.has_permission(sw.society_id, 'WORKER_MANAGE')
    )
  );

-- worker_id_sequence
CREATE POLICY "s6_admin_worker_id_sequence"
  ON worker_id_sequence FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'WORKER_MANAGE'));

-- ─── PART 7: RLS — Ticket Setup Tables ───────────────────────────────────────

-- complaint_category
CREATE POLICY "s6_admin_complaint_category"
  ON complaint_category FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'MAINTENANCE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

-- Residents can read categories (to submit complaints)
CREATE POLICY "s6_resident_read_complaint_category"
  ON complaint_category FOR SELECT TO authenticated
  USING (private.is_society_member(society_id));

-- maintenance_category
CREATE POLICY "s6_admin_maintenance_category"
  ON maintenance_category FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'MAINTENANCE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

CREATE POLICY "s6_resident_read_maintenance_category"
  ON maintenance_category FOR SELECT TO authenticated
  USING (private.is_society_member(society_id));

-- ticket_sequence (admin only)
CREATE POLICY "s6_admin_ticket_sequence"
  ON ticket_sequence FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

-- service_level_policy
CREATE POLICY "s6_admin_service_level_policy"
  ON service_level_policy FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'MAINTENANCE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

-- ─── PART 8: RLS — Complaint ─────────────────────────────────────────────────

CREATE POLICY "s6_admin_select_complaint"
  ON complaint FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

CREATE POLICY "s6_admin_write_complaint"
  ON complaint FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'MAINTENANCE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

CREATE POLICY "s6_resident_select_own_complaint"
  ON complaint FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

CREATE POLICY "s6_resident_insert_complaint"
  ON complaint FOR INSERT TO authenticated
  WITH CHECK (private.owns_resident(resident_id));

-- complaint_message (residents see RESIDENT_VISIBLE only)
CREATE POLICY "s6_admin_select_complaint_message"
  ON complaint_message FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_message.complaint_id
        AND private.has_permission(c.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_select_own_complaint_message"
  ON complaint_message FOR SELECT TO authenticated
  USING (
    visibility = 'RESIDENT_VISIBLE'
    AND EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_message.complaint_id
        AND private.owns_resident(c.resident_id)
    )
  );

CREATE POLICY "s6_resident_insert_complaint_message"
  ON complaint_message FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_message.complaint_id
        AND private.owns_resident(c.resident_id)
    )
  );

-- complaint_attachment
CREATE POLICY "s6_admin_complaint_attachment"
  ON complaint_attachment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_attachment.complaint_id
        AND private.has_permission(c.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_attachment.complaint_id
        AND private.has_permission(c.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_complaint_attachment"
  ON complaint_attachment FOR ALL TO authenticated
  USING (
    sensitive = false
    AND EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_attachment.complaint_id
        AND private.owns_resident(c.resident_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_attachment.complaint_id
        AND private.owns_resident(c.resident_id)
    )
  );

-- complaint_status_history
CREATE POLICY "s6_admin_complaint_status_history"
  ON complaint_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_status_history.complaint_id
        AND private.has_permission(c.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_own_complaint_status_history"
  ON complaint_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_status_history.complaint_id
        AND private.owns_resident(c.resident_id)
    )
  );

-- complaint_administrator_assignment (admin only)
CREATE POLICY "s6_admin_complaint_administrator_assignment"
  ON complaint_administrator_assignment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_administrator_assignment.complaint_id
        AND private.has_permission(c.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = complaint_administrator_assignment.complaint_id
        AND private.has_permission(c.society_id, 'MAINTENANCE_MANAGE')
    )
  );

-- ─── PART 9: RLS — Maintenance Request ───────────────────────────────────────

CREATE POLICY "s6_admin_select_maintenance_request"
  ON maintenance_request FOR SELECT TO authenticated
  USING (private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

CREATE POLICY "s6_admin_write_maintenance_request"
  ON maintenance_request FOR ALL TO authenticated
  USING     (private.has_permission(society_id, 'MAINTENANCE_MANAGE'))
  WITH CHECK(private.has_permission(society_id, 'MAINTENANCE_MANAGE'));

CREATE POLICY "s6_resident_select_own_maintenance"
  ON maintenance_request FOR SELECT TO authenticated
  USING (private.owns_resident(resident_id));

CREATE POLICY "s6_resident_insert_maintenance"
  ON maintenance_request FOR INSERT TO authenticated
  WITH CHECK (private.owns_resident(resident_id));

-- maintenance_message
CREATE POLICY "s6_admin_maintenance_message"
  ON maintenance_message FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_message.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_message.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_maintenance_message"
  ON maintenance_message FOR ALL TO authenticated
  USING (
    visibility = 'RESIDENT_VISIBLE'
    AND EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_message.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_message.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  );

-- maintenance_attachment
CREATE POLICY "s6_admin_maintenance_attachment"
  ON maintenance_attachment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_attachment.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_attachment.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_maintenance_attachment"
  ON maintenance_attachment FOR ALL TO authenticated
  USING (
    sensitive = false
    AND EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_attachment.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_attachment.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  );

-- maintenance_status_history
CREATE POLICY "s6_admin_maintenance_status_history"
  ON maintenance_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_status_history.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_maintenance_status_history"
  ON maintenance_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_status_history.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  );

-- worker_assignment (admin only)
CREATE POLICY "s6_admin_worker_assignment"
  ON worker_assignment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = worker_assignment.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = worker_assignment.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

-- Residents can see their assignment (worker info for their maintenance request)
CREATE POLICY "s6_resident_read_worker_assignment"
  ON worker_assignment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = worker_assignment.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  );

-- maintenance_appointment
CREATE POLICY "s6_admin_maintenance_appointment"
  ON maintenance_appointment FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_appointment.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_appointment.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_read_appointment"
  ON maintenance_appointment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_appointment.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  );

-- maintenance_resolution
CREATE POLICY "s6_admin_maintenance_resolution"
  ON maintenance_resolution FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_resolution.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_resolution.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_read_resolution"
  ON maintenance_resolution FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = maintenance_resolution.maintenance_request_id
        AND private.owns_resident(mr.resident_id)
    )
  );

-- service_rating (residents read + write own)
CREATE POLICY "s6_admin_service_rating"
  ON service_rating FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = service_rating.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = service_rating.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

CREATE POLICY "s6_resident_service_rating"
  ON service_rating FOR ALL TO authenticated
  USING     (private.owns_resident(resident_id))
  WITH CHECK(private.owns_resident(resident_id));

-- escalation_record (admin only)
CREATE POLICY "s6_admin_escalation_record"
  ON escalation_record FOR SELECT TO authenticated
  USING (
    (complaint_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM complaint c
      WHERE c.id = escalation_record.complaint_id
        AND private.has_permission(c.society_id, 'MAINTENANCE_MANAGE')
    ))
    OR
    (maintenance_request_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = escalation_record.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    ))
  );

-- contact_disclosure_log (admin only)
CREATE POLICY "s6_admin_contact_disclosure_log"
  ON contact_disclosure_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_request mr
      WHERE mr.id = contact_disclosure_log.maintenance_request_id
        AND private.has_permission(mr.society_id, 'MAINTENANCE_MANAGE')
    )
  );

-- ─── PART 10: api schema views ────────────────────────────────────────────────

-- api.staff_members — excludes identity_ciphertext, shows identity_last_four
CREATE OR REPLACE VIEW api.staff_members
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  staff_number,
  full_name,
  gender,
  email,
  primary_phone,
  alternate_phone,
  identity_last_four,
  date_of_birth,
  status,
  archived_at,
  created_at,
  updated_at
FROM public.staff_member;

GRANT SELECT ON api.staff_members TO authenticated;

-- api.salary_records — all columns safe
CREATE OR REPLACE VIEW api.salary_records
  WITH (security_invoker = true) AS
SELECT
  id,
  staff_id,
  salary_period_id,
  salary_structure_id,
  basic_salary,
  allowances,
  deductions,
  adjustment_total,
  net_payable,
  amount_paid,
  currency,
  status,
  generated_at,
  paid_at,
  notes,
  updated_at
FROM public.salary_record;

GRANT SELECT ON api.salary_records TO authenticated;

-- api.salary_slips — strips pdf_object_key + verification_hash
CREATE OR REPLACE VIEW api.salary_slips
  WITH (security_invoker = true) AS
SELECT
  id,
  salary_record_id,
  slip_number,
  status,
  issued_by_user_id,
  issued_at,
  reversed_at,
  created_at
FROM public.salary_slip;

GRANT SELECT ON api.salary_slips TO authenticated;

-- api.service_workers — excludes identity_ciphertext
CREATE OR REPLACE VIEW api.service_workers
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  worker_number,
  primary_category_id,
  contractor_company_id,
  full_name,
  identity_last_four,
  primary_phone,
  email,
  relationship,
  experience_years,
  status,
  archived_at,
  created_at,
  updated_at
FROM public.service_worker;

GRANT SELECT ON api.service_workers TO authenticated;

-- api.complaints — all safe columns
CREATE OR REPLACE VIEW api.complaints
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  resident_id,
  property_id,
  unit_id,
  category_id,
  ticket_number,
  subject,
  description,
  location,
  resident_urgency,
  priority,
  privacy,
  status,
  target_response_at,
  target_resolution_at,
  responded_at,
  resolved_at,
  closed_at,
  created_at,
  updated_at
FROM public.complaint;

GRANT SELECT ON api.complaints TO authenticated;

-- api.maintenance_requests — all safe columns
CREATE OR REPLACE VIEW api.maintenance_requests
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  resident_id,
  property_id,
  unit_id,
  category_id,
  ticket_number,
  subject,
  description,
  exact_location,
  preferred_visit_date,
  resident_urgency,
  priority,
  status,
  target_response_at,
  target_resolution_at,
  responded_at,
  completed_at,
  closed_at,
  created_at,
  updated_at
FROM public.maintenance_request;

GRANT SELECT ON api.maintenance_requests TO authenticated;

-- api.service_ratings — excludes confidential_comments
CREATE OR REPLACE VIEW api.service_ratings
  WITH (security_invoker = true) AS
SELECT
  id,
  maintenance_request_id,
  resident_id,
  worker_id,
  overall,
  service_quality,
  timeliness,
  professional_behaviour,
  comments,
  created_at,
  updated_at
FROM public.service_rating;

GRANT SELECT ON api.service_ratings TO authenticated;

-- ─── PART 11: PostgreSQL RPC — fn_next_ticket_number ─────────────────────────

-- Atomically increments ticket sequence.
-- ticket_kind: 'COMPLAINT' | 'MAINTENANCE'
-- Returns: 'CMP-2026-000001' or 'MNT-2026-000001'
CREATE OR REPLACE FUNCTION api.fn_next_ticket_number(
  p_society_id  uuid,
  p_ticket_type text,
  p_year        int
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next   bigint;
  v_prefix text;
BEGIN
  IF p_ticket_type = 'COMPLAINT' THEN
    v_prefix := 'CMP';
  ELSIF p_ticket_type = 'MAINTENANCE' THEN
    v_prefix := 'MNT';
  ELSE
    RAISE EXCEPTION 'Unknown ticket_type: %', p_ticket_type;
  END IF;

  INSERT INTO ticket_sequence (society_id, ticket_type, sequence_year, next_value, updated_at)
  VALUES (p_society_id, p_ticket_type::text, p_year, 2, now())
  ON CONFLICT (society_id, ticket_type, sequence_year)
  DO UPDATE SET
    next_value = ticket_sequence.next_value + 1,
    updated_at = now()
  RETURNING next_value - 1 INTO v_next;

  RETURN v_prefix || '-' || p_year::text || '-' || LPAD(v_next::text, 6, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION api.fn_next_ticket_number(uuid, text, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION api.fn_next_ticket_number(uuid, text, int) TO authenticated;
