-- =============================================================================
-- Phase S7: Row Level Security + api Views — Notifications Module
-- =============================================================================
-- Covers 18 tables: outbox_event, notification_template,
--   notification_template_version, notification_batch, notification,
--   notification_recipient, notification_delivery, delivery_attempt,
--   notification_provider_reference, notification_preference,
--   consent_or_preference_history, notification_schedule, announcement,
--   announcement_audience, announcement_audience_snapshot,
--   announcement_attachment, provider_callback_event, notification_job_claim
-- =============================================================================

-- PART 1: GRANTs
GRANT SELECT                  ON TABLE outbox_event                      TO authenticated;
GRANT SELECT                  ON TABLE notification_template              TO authenticated;
GRANT SELECT                  ON TABLE notification_template_version      TO authenticated;
GRANT SELECT                  ON TABLE notification_batch                 TO authenticated;
GRANT SELECT                  ON TABLE notification                       TO authenticated;
GRANT SELECT                  ON TABLE notification_recipient             TO authenticated;
GRANT SELECT                  ON TABLE notification_delivery              TO authenticated;
GRANT SELECT                  ON TABLE delivery_attempt                   TO authenticated;
GRANT SELECT                  ON TABLE notification_provider_reference    TO authenticated;
GRANT SELECT, UPDATE          ON TABLE notification_preference            TO authenticated;
GRANT SELECT                  ON TABLE consent_or_preference_history      TO authenticated;
GRANT SELECT                  ON TABLE notification_schedule              TO authenticated;
GRANT SELECT                  ON TABLE announcement                       TO authenticated;
GRANT SELECT                  ON TABLE announcement_audience              TO authenticated;
GRANT SELECT                  ON TABLE announcement_audience_snapshot     TO authenticated;
GRANT SELECT                  ON TABLE announcement_attachment            TO authenticated;
GRANT SELECT                  ON TABLE provider_callback_event            TO authenticated;
GRANT SELECT                  ON TABLE notification_job_claim             TO authenticated;

-- PART 2: RLS — outbox_event (admin only)
CREATE POLICY "s7_admin_outbox_event"
  ON outbox_event FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 3: RLS — notification_template
CREATE POLICY "s7_admin_notification_template"
  ON notification_template FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_admin_notification_template_version"
  ON notification_template_version FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_template nt
      JOIN user_account ua ON ua.society_id = nt.society_id
      WHERE nt.id = notification_template_version.template_id
        AND ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 4: RLS — notification_batch
CREATE POLICY "s7_admin_notification_batch"
  ON notification_batch FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 5: RLS — notification
CREATE POLICY "s7_admin_notification"
  ON notification FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 6: RLS — notification_recipient
CREATE POLICY "s7_admin_notification_recipient"
  ON notification_recipient FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_own_notification_recipient"
  ON notification_recipient FOR SELECT TO authenticated
  USING (user_id = private.current_account_id());

-- PART 7: RLS — notification_delivery
CREATE POLICY "s7_admin_notification_delivery"
  ON notification_delivery FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipient nr
      JOIN user_account ua ON ua.id = nr.user_id
      WHERE nr.id = notification_delivery.recipient_id
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_own_notification_delivery"
  ON notification_delivery FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipient nr
      WHERE nr.id = notification_delivery.recipient_id
        AND nr.user_id = private.current_account_id()
    )
  );

-- PART 8: RLS — delivery_attempt (admin only)
CREATE POLICY "s7_admin_delivery_attempt"
  ON delivery_attempt FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_delivery nd
      JOIN notification_recipient nr ON nr.id = nd.recipient_id
      JOIN user_account ua ON ua.id = nr.user_id
      WHERE nd.id = delivery_attempt.delivery_id
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 9: RLS — notification_provider_reference
CREATE POLICY "s7_admin_provider_reference"
  ON notification_provider_reference FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 10: RLS — notification_preference
CREATE POLICY "s7_admin_notification_preference"
  ON notification_preference FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_own_notification_preference"
  ON notification_preference FOR SELECT TO authenticated
  USING (user_id = private.current_account_id());

CREATE POLICY "s7_own_update_notification_preference"
  ON notification_preference FOR UPDATE TO authenticated
  USING     (user_id = private.current_account_id())
  WITH CHECK(user_id = private.current_account_id());

-- PART 11: RLS — consent_or_preference_history
-- consent_or_preference_history links to notification_preference via preference_id
CREATE POLICY "s7_own_preference_history"
  ON consent_or_preference_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_preference np
      WHERE np.id = consent_or_preference_history.preference_id
        AND np.user_id = private.current_account_id()
    )
  );

CREATE POLICY "s7_admin_preference_history"
  ON consent_or_preference_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 12: RLS — notification_schedule
CREATE POLICY "s7_admin_notification_schedule"
  ON notification_schedule FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 13: RLS — announcement
CREATE POLICY "s7_admin_announcement"
  ON announcement FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_member_read_published_announcement"
  ON announcement FOR SELECT TO authenticated
  USING (
    status = 'PUBLISHED'
    AND private.is_society_member(society_id)
  );

-- PART 14: RLS — announcement_audience + snapshot + attachment
CREATE POLICY "s7_admin_announcement_audience"
  ON announcement_audience FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM announcement a
      JOIN user_account ua ON ua.id = private.current_account_id()
      WHERE a.id = announcement_audience.announcement_id
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_admin_announcement_audience_snapshot"
  ON announcement_audience_snapshot FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM announcement a
      JOIN user_account ua ON ua.id = private.current_account_id()
      WHERE a.id = announcement_audience_snapshot.announcement_id
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_admin_announcement_attachment"
  ON announcement_attachment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM announcement a
      JOIN user_account ua ON ua.id = private.current_account_id()
      WHERE a.id = announcement_attachment.announcement_id
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_member_read_announcement_attachment"
  ON announcement_attachment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM announcement a
      WHERE a.id = announcement_attachment.announcement_id
        AND a.status = 'PUBLISHED'
        AND private.is_society_member(a.society_id)
    )
  );

-- PART 15: RLS — provider_callback_event + notification_job_claim
CREATE POLICY "s7_admin_provider_callback_event"
  ON provider_callback_event FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

CREATE POLICY "s7_admin_notification_job_claim"
  ON notification_job_claim FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_account ua
      WHERE ua.id = private.current_account_id()
        AND private.has_permission(ua.society_id, 'NOTIFICATION_ADMIN')
    )
  );

-- PART 16: api schema views
CREATE OR REPLACE VIEW api.my_notifications
  WITH (security_invoker = true) AS
SELECT
  nr.id              AS recipient_id,
  nr.user_id         AS user_account_id,
  n.id               AS notification_id,
  n.subject,
  n.rendered_content AS body_text,
  n.notification_type,
  n.priority,
  nr.read_status,
  nr.read_at,
  nr.created_at
FROM public.notification_recipient nr
JOIN public.notification n ON n.id = nr.notification_id;

GRANT SELECT ON api.my_notifications TO authenticated;

CREATE OR REPLACE VIEW api.my_deliveries
  WITH (security_invoker = true) AS
SELECT
  nd.id,
  nd.recipient_id,
  nd.channel,
  nd.status,
  nd.retry_count,
  nd.accepted_at,
  nd.delivered_at,
  nd.failure_reason,
  nd.created_at
FROM public.notification_delivery nd
JOIN public.notification_recipient nr ON nr.id = nd.recipient_id;

GRANT SELECT ON api.my_deliveries TO authenticated;

CREATE OR REPLACE VIEW api.announcements
  WITH (security_invoker = true) AS
SELECT
  id,
  society_id,
  subject,
  message,
  category,
  priority,
  status,
  publish_at,
  expires_at,
  requires_acknowledgment,
  created_at
FROM public.announcement
WHERE status = 'PUBLISHED';

GRANT SELECT ON api.announcements TO authenticated;
