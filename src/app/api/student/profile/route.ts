import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  furigana: z.string().min(1),
  university: z.string().optional(),
  department: z.string().optional(),
  grade: z.string().optional(),
  gender: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("student_profile", JSON.stringify(parsed.data), {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  return res;
}
