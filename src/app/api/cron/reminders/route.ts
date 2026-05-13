import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const now = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reminders, error: remErr } = await (service as any)
    .from("event_reminders")
    .select("id, event_id, hours_before, events(id, title, date, location, circle_id, circles(name))");

  if (remErr) {
    console.error("Failed to fetch reminders:", remErr);
    return NextResponse.json({ error: remErr.message }, { status: 500 });
  }

  let sent = 0;

  for (const reminder of (reminders ?? [])) {
    const event = reminder.events as {
      id: string;
      title: string;
      date: string;
      location: string | null;
      circle_id: string;
      circles: { name: string } | null;
    } | null;

    if (!event) continue;

    const eventTime = new Date(event.date);
    const targetTime = new Date(eventTime.getTime() - reminder.hours_before * 60 * 60 * 1000);
    const windowMs = 30 * 60 * 1000; // 30-minute cron window

    // Only fire if we're within the 30-minute window before targetTime
    if (now < targetTime || now > new Date(targetTime.getTime() + windowMs)) continue;

    // Get approved reservations for this event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reservations } = await (service as any)
      .from("reservations")
      .select("id, name, email")
      .eq("event_id", event.id)
      .eq("status", "approved");

    for (const res of (reservations ?? [])) {
      // Check if reminder already sent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (service as any)
        .from("reminder_sent_log")
        .select("id")
        .eq("event_id", event.id)
        .eq("reservation_id", res.id)
        .eq("hours_before", reminder.hours_before)
        .maybeSingle();

      if (existing) continue;

      const circleName = event.circles?.name ?? "";
      const hoursLabel = reminder.hours_before >= 24
        ? `${reminder.hours_before / 24}日`
        : `${reminder.hours_before}時間`;

      const eventDate = new Date(event.date).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Send in-app message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).from("messages").insert({
        reservation_id: res.id,
        sender_type: "admin",
        body: `【リマインド】${event.title} まで${hoursLabel}を切りました。\n\n日時：${eventDate}${event.location ? `\n場所：${event.location}` : ""}\n\nご参加をお待ちしております。\n— ${circleName}`,
      });

      // Send email
      await sendEmail({
        to: res.email,
        subject: `【リマインド】${event.title} まで${hoursLabel}`,
        html: `
          <p>${res.name} さん</p>
          <p>「<strong>${event.title}</strong>」まで${hoursLabel}を切りました。</p>
          <ul>
            <li>日時：${eventDate}</li>
            ${event.location ? `<li>場所：${event.location}</li>` : ""}
          </ul>
          <p>ご参加をお待ちしております。</p>
          <p>— ${circleName}</p>
        `,
      }).catch((e) => console.error("Email error:", e));

      // Record that we sent this reminder
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).from("reminder_sent_log").insert({
        event_id: event.id,
        reservation_id: res.id,
        hours_before: reminder.hours_before,
      });

      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
