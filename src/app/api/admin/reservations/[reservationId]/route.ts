import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { reservationStatusHtml } from "@/lib/email/templates";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const { reservationId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify admin owns the circle this reservation belongs to
  const { data: reservation } = await supabase
    .from("reservations")
    .select("*, events(title, circle_id)")
    .eq("id", reservationId)
    .single();

  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = reservation.events as { title: string; circle_id: string } | null;
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: admin } = await supabase
    .from("circle_admins")
    .select("id")
    .eq("user_id", user.id)
    .eq("circle_id", event.circle_id)
    .single();

  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("reservations")
    .update({ status: parsed.data.status })
    .eq("id", reservationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify reservee
  await sendEmail({
    to: reservation.email,
    subject: `【予約${parsed.data.status === "approved" ? "承認" : "却下"}】${event.title}`,
    html: reservationStatusHtml({
      name: reservation.name,
      eventTitle: event.title,
      status: parsed.data.status,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
