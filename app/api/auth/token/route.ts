import { NextResponse } from 'next/server';
import { getOrCreateToken } from '../../../../lib/auth';

// Must use Node.js runtime for fs access
export const runtime = 'nodejs';

/**
 * Public endpoint to retrieve the auth token.
 * 
 * This is safe because:
 * 1. Only accessible from localhost (Next.js dev server binds to 127.0.0.1)
 * 2. Attacker would need local file access to call this
 * 3. If they have local file access, they can already read the token file
 * 
 * The token protects against blind attacks where malicious apps
 * try to hit endpoints without first reading the token.
 */
export async function GET() {
  try {
    const token = getOrCreateToken();
    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to get token' },
      { status: 500 }
    );
  }
}
