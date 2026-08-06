import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase.server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const results: Record<string, unknown> = { id };

  // Test 1: Basic resident fetch
  const r1 = await supabase
    .from('resident')
    .select('id, full_name, status, society_id')
    .eq('id', id)
    .single();
  results['resident'] = { data: r1.data, error: r1.error?.message };

  // Test 2: Occupancies
  const r2 = await supabase
    .from('resident_occupancy')
    .select('*, unit(*, property(*))')
    .eq('resident_id', id);
  results['occupancies'] = {
    count: r2.data?.length,
    error: r2.error?.message,
  };

  // Test 3: ID Cards
  const r3 = await supabase
    .from('resident_id_card')
    .select('id, status, issued_at')
    .eq('resident_id', id);
  results['idCards'] = { count: r3.data?.length, error: r3.error?.message };

  // Test 4: Vehicles
  const r4 = await supabase
    .from('vehicle')
    .select('id, type, registration_number')
    .eq('resident_id', id);
  results['vehicles'] = { count: r4.data?.length, error: r4.error?.message };

  // Test 5: Documents
  const r5 = await supabase
    .from('resident_document')
    .select('id, category, status')
    .eq('resident_id', id);
  results['documents'] = { count: r5.data?.length, error: r5.error?.message };

  return NextResponse.json(results, { status: 200 });
}
