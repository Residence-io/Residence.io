/**
 * Supabase Edge Function: process-notifications
 * Phase S7: Processes pending OutboxEvent rows.
 * Replaces NestJS setInterval when FEATURE_SUPABASE_NOTIFY=true.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BATCH_SIZE = 25;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    const { data: events, error } = await supabase
      .from('outbox_event')
      .select('*')
      .eq('status', 'PENDING')
      .lte('available_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw error;
    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending events' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await supabase
          .from('outbox_event')
          .update({ status: 'PROCESSING' })
          .eq('id', event.id);

        const recipientAccountId = await resolveEventRecipient(supabase, event);
        if (recipientAccountId) {
          const { data: notif, error: notifErr } = await supabase
            .from('notification')
            .insert({
              event_type: event.event_type,
              aggregate_type: event.aggregate_type,
              aggregate_id: event.aggregate_id,
              subject: buildSubject(event),
              body_text: buildBody(event),
              notification_type: mapEventToType(event.event_type),
              priority: 'NORMAL',
              idempotency_key: `outbox:${event.id}`,
            })
            .select('id')
            .single();

          if (!notifErr && notif) {
            await supabase.from('notification_recipient').insert({
              notification_id: notif.id,
              user_account_id: recipientAccountId,
            });
          }
        }

        await supabase
          .from('outbox_event')
          .update({
            status: 'PROCESSED',
            processed_at: new Date().toISOString(),
          })
          .eq('id', event.id);

        processed++;
      } catch (err) {
        failed++;
        await supabase
          .from('outbox_event')
          .update({
            status: 'FAILED',
            failed_attempts: (event.failed_attempts ?? 0) + 1,
            last_error: String(err),
            available_at: new Date(
              Date.now() +
                Math.min(
                  Math.pow(2, (event.failed_attempts ?? 0) + 1) * 60_000,
                  3_600_000,
                ),
            ).toISOString(),
          })
          .eq('id', event.id);
        console.error(`Failed to process outbox event ${event.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ processed, failed, total: events.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('process-notifications fatal error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function resolveEventRecipient(
  supabase: ReturnType<typeof createClient>,
  event: Record<string, unknown>,
): Promise<string | null> {
  const payload = event['payload'] as Record<string, unknown> | null;
  const residentId = payload?.['residentId'] as string | undefined;
  if (!residentId) return null;
  const { data } = await supabase
    .from('resident')
    .select('user_id')
    .eq('id', residentId)
    .maybeSingle();
  return (data as { user_id?: string } | null)?.user_id ?? null;
}

function buildSubject(event: Record<string, unknown>): string {
  const subjects: Record<string, string> = {
    MONTHLY_DUE_CREATED: 'New Monthly Due Generated',
    PAYMENT_CONFIRMED: 'Payment Confirmed',
    COMPLAINT_STATUS_CHANGED: 'Complaint Status Updated',
    MAINTENANCE_STATUS_CHANGED: 'Maintenance Request Updated',
  };
  return subjects[event['event_type'] as string] ?? 'Notification';
}

function buildBody(event: Record<string, unknown>): string {
  const eventType = event['event_type'] as string;
  const payload = event['payload'] as Record<string, unknown> | null;
  const bodies: Record<string, (p: Record<string, unknown>) => string> = {
    MONTHLY_DUE_CREATED: (p) =>
      `Your monthly due of ${p['currency']} ${p['amount']} is due on ${p['dueDate']}.`,
    PAYMENT_CONFIRMED: (p) =>
      `Your payment of ${p['currency']} ${p['amount']} (${p['receiptNumber']}) has been confirmed.`,
    COMPLAINT_STATUS_CHANGED: (p) =>
      `Your complaint ${p['ticketNumber']} status changed to ${p['status']}.`,
    MAINTENANCE_STATUS_CHANGED: (p) =>
      `Your maintenance request ${p['ticketNumber']} status changed to ${p['status']}.`,
  };
  const builder = bodies[eventType];
  return builder ? builder(payload ?? {}) : 'You have a new notification.';
}

function mapEventToType(eventType: string): string {
  const map: Record<string, string> = {
    MONTHLY_DUE_CREATED: 'BILLING',
    PAYMENT_CONFIRMED: 'BILLING',
    COMPLAINT_STATUS_CHANGED: 'TICKET',
    MAINTENANCE_STATUS_CHANGED: 'TICKET',
  };
  return map[eventType] ?? 'SYSTEM';
}
