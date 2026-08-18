import { createSupabaseServerClient } from '@/lib/supabase.server';
import type { ResidentDetail } from '@/lib/resident-types';

function apiBaseUrl() {
  let value = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!value) throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  if (!value.endsWith('/api/v1')) value += '/api/v1';
  return value;
}

async function nestFetch(path: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers();
  if (session?.access_token) {
    headers.set('authorization', `Bearer ${session.access_token}`);
  }
  return fetch(`${apiBaseUrl()}/${path.replace(/^\//, '')}`, {
    headers,
    cache: 'no-store',
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ message: 'Resident not found.' }, { status: 404 });

  try {
    const photograph =
      new URL(request.url).searchParams.get('asset') === 'photograph';

    if (photograph) {
      const residentResponse = await nestFetch(`residents/${id}`);
      if (!residentResponse.ok)
        return Response.json(
          { message: 'Resident not found.' },
          { status: residentResponse.status },
        );
      const resident = (await residentResponse.json()) as ResidentDetail;
      const photo = resident.documents.find(
        (document) =>
          document.category === 'PROFILE_PHOTOGRAPH' &&
          document.status === 'ACTIVE',
      );
      if (!photo)
        return Response.json(
          { message: 'Photograph not found.' },
          { status: 404 },
        );

      const fileResponse = await nestFetch(
        `residents/${id}/documents/${photo.id}`,
      );
      if (!fileResponse.ok)
        return Response.json(
          { message: 'Photograph unavailable.' },
          { status: fileResponse.status },
        );
      return new Response(await fileResponse.arrayBuffer(), {
        headers: {
          'content-type':
            fileResponse.headers.get('content-type') || photo.mediaType,
          'content-disposition': 'inline',
          'cache-control': 'private, no-store',
        },
      });
    }

    const cardResponse = await nestFetch(`residents/${id}/id-card`);
    if (!cardResponse.ok)
      return Response.json(
        { message: 'ID card unavailable.' },
        { status: cardResponse.status },
      );
    return new Response(await cardResponse.arrayBuffer(), {
      headers: {
        'content-type':
          cardResponse.headers.get('content-type') || 'application/pdf',
        'content-disposition': 'inline',
        'cache-control': 'private, no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : 'Preview unavailable.',
      },
      { status: 500 },
    );
  }
}
