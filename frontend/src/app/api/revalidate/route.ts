import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Sabit varsayilan YOK: fallback olsaydi env'siz her kurulum ayni bilinen
// secret'i kullanir ve herkes cache revalidation tetikleyebilirdi.
const SECRET = process.env.REVALIDATE_SECRET;

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3094',
  'http://localhost:3094',
  'http://127.0.0.1:3094',
].filter(Boolean);

function corsHeaders(origin?: string | null) {
  const matched = (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]) || '*';
  return {
    'Access-Control-Allow-Origin': matched,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  const body = await request.json().catch(() => ({}));
  const { secret, path, all } = body as { secret?: string; path?: string; all?: boolean };

  // SECRET tanimsizsa ONCE reddet: aksi halde env eksikken saldirganin
  // gonderdigi undefined, undefined !== undefined -> false uretip auth'u bypass eder.
  if (!SECRET) {
    return NextResponse.json({ error: 'revalidate_not_configured' }, { status: 500, headers });
  }

  if (secret !== SECRET) {
    return NextResponse.json({ error: 'invalid_secret' }, { status: 401, headers });
  }

  try {
    if (all) {
      revalidatePath('/', 'layout');
      return NextResponse.json({ revalidated: true, scope: 'all' }, { headers });
    }

    if (path) {
      revalidatePath(path, 'page');
      return NextResponse.json({ revalidated: true, path }, { headers });
    }

    revalidatePath('/tr', 'layout');
    revalidatePath('/en', 'layout');
    return NextResponse.json({ revalidated: true, scope: 'all-locales' }, { headers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'revalidation_failed' },
      { status: 500, headers },
    );
  }
}
