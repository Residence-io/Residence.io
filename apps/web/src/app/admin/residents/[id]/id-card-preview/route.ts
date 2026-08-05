import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api-client';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ message: 'Resident not found.' }, { status: 404 });
  const photograph =
    new URL(request.url).searchParams.get('asset') === 'photograph';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  const response = await fetch(
    `${API_URL}/residents/${id}/${
      photograph ? 'documents/profile-photograph' : 'id-card/preview'
    }`,
    {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    },
  );
  if (!response.ok)
    return Response.json(
      {
        message: photograph
          ? 'The resident photograph is unavailable.'
          : 'The ID-card preview is unavailable.',
      },
      { status: response.status },
    );
  return new Response(await response.arrayBuffer(), {
    headers: {
      'content-type': photograph
        ? (response.headers.get('content-type') ?? 'image/jpeg')
        : 'application/pdf',
      'content-disposition': 'inline',
      'cache-control': 'private, no-store',
    },
  });
}
