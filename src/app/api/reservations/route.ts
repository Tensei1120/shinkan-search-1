import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { reservationConfirmHtml, reservationNotifyHtml } from "@/lib/email/templates";
import { z } from "zod";

const schema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  grade: z.string().min(1),
  department: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }

  const { eventId, name, email, grade, department, note } = parsed.data;
  const supabase = createServiceClient();

  // Fetch event + circle (check capacity atomically with a transaction via RPC would be ideal,
  // but for simplicity we read-then-write and rely on the capacity check at DB level)
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*, circles(*)")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  if (event.status !== "open" || event.reserved_count >= event.capacity) {
    return NextResponse.json({ error: "このイベントは満員または受付を終了しています" }, { status: 409 });
  }

  // Insert reservation
  const { error: insertError } = await supabase.from("reservations").insert({
    event_id: eventId,
    name,
    email,
    grade,
    department,
    note: note ?? null,
    status: "pending",
  });

  if (insertError) {
    return NextResponse.json({ error: "予約の保存に失敗しました" }, { status: 500 });
  }

  const circle = event.circles as { name: string; contact_email: string };
  const info = {
    name,
    email,
    eventTitle: event.title,
    eventDate: event.date,
    eventLocation: event.location,
    circleName: circle.name,
    circleEmail: circle.contact_email,
  };

  // Send emails (non-blocking — errors are logged but don't fail the response)
  const emailResults = await Promise.allSettled([
    sendEmail({
      to: email,
      subject: `【予約完了】${event.title}`,
      html: reservationConfirmHtml(info),
    }),
    sendEmail({
      to: circle.contact_email,
      subject: `【新規予約】${event.title} に予約が入りました`,
      html: reservationNotifyHtml({ ...info, grade, department, note: note ?? null }),
    }),
  ]);
  emailResults.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[email ${i}] failed:`, r.reason);
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
