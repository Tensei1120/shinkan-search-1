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
    .select("id, email, event_id, status, events(cancel_deadline)")
    .eq("id", id)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  if (reservation.email !== email) {
    return NextResponse.json({ error: "メールアドレスが一致しません" }, { status: 403 });
  }

  if (reservation.status === "cancelled") {
    return NextResponse.json({ error: "すでにキャンセル済みです" }, { status: 400 });
  }

  if (reservation.status === "rejected") {
    return NextResponse.json({ error: "不承認の予約はキャンセルできません" }, { status: 400 });
  }

  // If cancelling past the deadline, record a penalty point
  const cancelDeadline = (reservation.events as { cancel_deadline: string | null } | null)?.cancel_deadline ?? null;
  const isPastDeadline = cancelDeadline != null && new Date() > new Date(cancelDeadline);
  if (isPastDeadline) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("cancel_penalties")
      .insert({ email, reservation_id: id });
  }

  await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", id);

  await supabase.rpc("decrement_reserved_count", { p_event_id: reservation.event_id });

  return NextResponse.json({ ok: true, penaltyAdded: isPastDeadline });
}
