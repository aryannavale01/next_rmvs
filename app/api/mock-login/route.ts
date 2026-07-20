import { NextResponse } from "next/server";
import { MOCK_ADMIN, MOCK_MEMBER } from "@/lib/auth/mock-credentials";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (username === MOCK_ADMIN.username && password === MOCK_ADMIN.password) {
    const response = NextResponse.json({ success: true, role: "admin" });
    response.cookies.set("session_token", "mock-authenticated", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  if (username === MOCK_MEMBER.username && password === MOCK_MEMBER.password) {
    const response = NextResponse.json({ success: true, role: "member" });
    response.cookies.set("session_token", "mock-authenticated", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  }

  return NextResponse.json(
    { success: false, message: "Invalid username or password" },
    { status: 401 }
  );
}
