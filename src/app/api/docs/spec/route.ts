import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Serve OpenAPI JSON spec
export async function GET() {
  try {
    const specPath = join(process.cwd(), 'openapi.json');
    const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
    return NextResponse.json(spec);
  } catch {
    return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
  }
}
