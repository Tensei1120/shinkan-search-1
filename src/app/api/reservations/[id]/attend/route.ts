import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "メールアドレスが不正です" }, { status: 400 });
  }

  const { email } = parsed.data;
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation, error } = await (supabase as any)
    .from("reservations")
    .select("id, email, status, attended_at")
    .eq("id", id)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }
  if (reservation.email !== email) {
    return NextResponse.json({ error: "メールアドレスが一致しません" }, { status: 403 });
  }
  if (reservation.status !== "approved") {
    return NextResponse.json({ error: "承認済みの予約のみ出席登録できます" }, { status: 400 });
  }

  // Toggle: if already attended → clear, otherwise → set now
  const attended_at = reservation.attended_at ? null : new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("reservations")
    .update({ attended_at })
    .eq("id", id);

  return NextResponse.json({ ok: true, attended: attended_at !== null });
}
