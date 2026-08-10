import { createSupabaseServerClient } from '@/lib/supabase.server';

export default async function ResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let residentData: any = null;
  let occupancyData: any[] = [];
  let idCardData: any[] = [];
  let vehicleData: any[] = [];
  let errors: Record<string, string> = {};

  try {
    const supabase = await createSupabaseServerClient();

    // Test 1: basic resident
    const r1 = await supabase
      .from('resident')
      .select('*')
      .eq('id', id)
      .single();
    if (r1.error) errors['resident'] = r1.error.message;
    else residentData = r1.data;

    // Test 2: occupancies
    const r2 = await supabase
      .from('resident_occupancy')
      .select('*, unit:unit(*, property:property(*))')
      .eq('resident_id', id);
    if (r2.error) errors['occupancy'] = r2.error.message;
    else occupancyData = r2.data ?? [];

    // Test 3: id cards
    const r3 = await supabase
      .from('resident_id_card')
      .select('*')
      .eq('resident_id', id);
    if (r3.error) errors['idCard'] = r3.error.message;
    else idCardData = r3.data ?? [];

    // Test 4: vehicles
    const r4 = await supabase.from('vehicle').select('*').eq('resident_id', id);
    if (r4.error) errors['vehicle'] = r4.error.message;
    else vehicleData = r4.data ?? [];
  } catch (e: any) {
    errors['fatal'] = e?.message ?? String(e);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1 style={{ marginBottom: '1rem' }}>
        🔍 Resident Debug — {residentData?.full_name ?? id}
      </h1>

      {Object.keys(errors).length > 0 && (
        <div
          style={{
            background: '#fee2e2',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}
        >
          <strong>❌ Errors:</strong>
          <pre>{JSON.stringify(errors, null, 2)}</pre>
        </div>
      )}

      <div
        style={{
          background: '#f0fdf4',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}
      >
        <strong>✅ Resident Data:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(residentData, null, 2)}
        </pre>
      </div>

      <div
        style={{
          background: '#eff6ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}
      >
        <strong>🏠 Occupancies ({occupancyData.length}):</strong>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(occupancyData, null, 2)}
        </pre>
      </div>

      <div
        style={{
          background: '#fefce8',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}
      >
        <strong>🪪 ID Cards ({idCardData.length}):</strong>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(idCardData, null, 2)}
        </pre>
      </div>

      <div
        style={{
          background: '#fdf4ff',
          padding: '1rem',
          borderRadius: '8px',
        }}
      >
        <strong>🚗 Vehicles ({vehicleData.length}):</strong>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(vehicleData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
