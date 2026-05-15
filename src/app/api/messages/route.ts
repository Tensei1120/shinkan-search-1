import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reservationId = searchParams.get("reservationId");
  const email = searchParams.get("email");

  if (!reservationId) {
    return NextResponse.json({ error: "reservationId required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Allow admin (authenticated) or student matching by email
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Student access: verify email matches reservation
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reservation } = await (service as any)
      .from("reservations")
      .select("id, email")
      .eq("id", reservationId)
      .single();

    if (!reservation || reservation.email !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages, error } = await (service as any)
    .from("messages")
    .select("id, sender_type, body, created_at, read_at")
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark unread messages as read
  if (!user && email && messages?.length > 0) {
    // Student reading → mark admin messages as read
    const unread = messages
      .filter((m: { sender_type: string; read_at: string | null }) => m.sender_type === "admin" && !m.read_at)
      .map((m: { id: string }) => m.id);
    if (unread.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any)
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread);
    }
  } else if (user && messages?.length > 0) {
    // Admin reading → mark student messages as read
    const unread = messages
      .filter((m: { sender_type: string; read_at: string | null }) => m.sender_type === "student" && !m.read_at)
      .map((m: { id: string }) => m.id);
    if (unread.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any)
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread);
    }
  }

  return NextResponse.json({ messages });
}

const postSchema = z.object({
  reservationId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  senderType: z.enum(["admin", "student"]),
  email: z.string().email().optional(), // required when senderType = student
});

export async function POST(req: NextRequest) {
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { reservationId, body, senderType, email } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (senderType === "admin") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    // Student: verify email matches reservation
    if (!email) return NextResponse.json({ error: "email required for student" }, { status: 400 });
    const svc = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reservation } = await (svc as any)
      .from("reservations")
      .select("id, email")
      .eq("id", reservationId)
      .single();
    if (!reservation || reservation.email !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: message, error } = await (service as any)
    .from("messages")
    .insert({ reservation_id: reservationId, sender_type: senderType, body })
    .select("id, sender_type, body, created_at, read_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message });
}
