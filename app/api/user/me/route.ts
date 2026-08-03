import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/session";

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  return NextResponse.json({
    user: auth.session.user,
    session: {
      id: auth.session.session.id,
      expiresAt: auth.session.session.expiresAt,
    },
  });
}
