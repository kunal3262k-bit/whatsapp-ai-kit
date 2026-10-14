import { NextResponse } from 'next/server';
import { parseProspectFile } from '../../../../lib/outreach-parse';
import { requireAdmin } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Accept a prospect spreadsheet (.csv/.xlsx) and return parsed rows for the
 * outreach board. Gated exactly like the other admin APIs.
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return new NextResponse('Not Found', { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large — max 2 MB' }, { status: 413 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const { rows, warning } = parseProspectFile(file.name, buf);
    return NextResponse.json({ count: rows.length, rows, warning });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse file';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
