import { createSupabaseServerClient } from '@/lib/supabase.server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ message: 'Resident not found.' }, { status: 404 });

  const photograph =
    new URL(request.url).searchParams.get('asset') === 'photograph';

  const supabase = await createSupabaseServerClient();

  if (photograph) {
    // Read profile photo directly from Supabase Storage
    const { data: resident } = await supabase
      .from('resident')
      .select('profile_photograph_object_key')
      .eq('id', id)
      .single();

    const objectKey = resident?.profile_photograph_object_key;
    if (!objectKey)
      return Response.json(
        { message: 'Photograph not found.' },
        { status: 404 },
      );

    const { data: fileData, error } = await supabase.storage
      .from('resident-documents')
      .download(objectKey);

    if (error || !fileData)
      return Response.json(
        { message: 'Photograph unavailable.' },
        { status: 404 },
      );

    return new Response(await fileData.arrayBuffer(), {
      headers: {
        'content-type': fileData.type || 'image/jpeg',
        'content-disposition': 'inline',
        'cache-control': 'private, no-store',
      },
    });
  }

  // ID card preview — fetch resident data and render as HTML (printable card)
  const { data: resident } = await supabase
    .from('resident')
    .select(
      'full_name, resident_number, primary_phone, profile_photograph_object_key',
    )
    .eq('id', id)
    .single();

  if (!resident)
    return Response.json({ message: 'Resident not found.' }, { status: 404 });

  // Build a simple printable ID card as HTML → PDF would need a library
  // For now return a self-contained HTML card
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { margin: 0; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f4f8; }
  .card { width: 340px; background: linear-gradient(135deg,#1e3a8a,#1e40af); border-radius: 16px; padding: 24px; color: white; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
  .logo { font-size: 11px; letter-spacing: 2px; opacity: 0.7; text-transform: uppercase; }
  .name { font-size: 22px; font-weight: bold; margin: 16px 0 4px; }
  .number { font-size: 12px; opacity: 0.8; letter-spacing: 1px; }
  .phone { margin-top: 12px; font-size: 13px; opacity: 0.9; }
  .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 10px; opacity: 0.6; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">Residence Society</div>
  <div class="name">${resident.full_name}</div>
  <div class="number">${resident.resident_number}</div>
  <div class="phone">📞 ${resident.primary_phone}</div>
  <div class="footer">Resident ID Card · Valid for current year</div>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html',
      'content-disposition': 'inline',
      'cache-control': 'private, no-store',
    },
  });
}
