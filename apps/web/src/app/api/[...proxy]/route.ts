import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase.server';

function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!value) throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  return value;
}

async function handleRequest(
  req: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> },
) {
  try {
    const { proxy } = await params;
    const path = proxy.join('/');
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = new Headers();
    for (const name of ['content-type', 'accept', 'x-correlation-id']) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (session?.access_token) {
      headers.set('authorization', `Bearer ${session.access_token}`);
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const upstream = await fetch(
      `${apiBaseUrl()}/${path}${req.nextUrl.search}`,
      {
        method: req.method,
        headers,
        body: body && body.byteLength ? body : undefined,
        cache: 'no-store',
        redirect: 'manual',
      },
    );

    const responseHeaders = new Headers();
    for (const name of [
      'content-type',
      'content-disposition',
      'location',
      'cache-control',
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('API proxy error:', message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
