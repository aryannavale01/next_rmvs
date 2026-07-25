import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.success) {
    return NextResponse.json({ user: null, session: null }, { status: 401 });
  }

  return NextResponse.json({
    user: auth.session.user,
    session: {
      id: auth.session.session.id,
      expiresAt: auth.session.session.expiresAt,
    },
  });
}
