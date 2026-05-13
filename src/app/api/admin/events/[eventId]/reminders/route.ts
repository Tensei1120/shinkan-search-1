import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

async function verifyAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventId: string
) {
  const { data: event } = await supabase
    .from("events")
    .select("circle_id")
    .eq("id", eventId)
    .single();
  if (!event) return false;

  const { data: admin } = await supabase
    .from("circle_admins")
    .select("id")
    .eq("user_id", userId)
    .eq("circle_id", event.circle_id)
    .single();

  return !!admin;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = await verifyAdmin(supabase, user.id, eventId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from("event_reminders")
    .select("id, hours_before")
    .eq("event_id", eventId)
    .order("hours_before", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminders: data ?? [] });
}

const postSchema = z.object({
  hours_before: z.number().int().min(1).max(720),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = await verifyAdmin(supabase, user.id, eventId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from("event_reminders")
    .insert({ event_id: eventId, hours_before: parsed.data.hours_before })
    .select("id, hours_before")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "その時間はすでに設定済みです" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reminder: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = await verifyAdmin(supabase, user.id, eventId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const reminderId = searchParams.get("reminderId");
  if (!reminderId) return NextResponse.json({ error: "reminderId required" }, { status: 400 });

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("event_reminders")
    .delete()
    .eq("id", reminderId)
    .eq("event_id", eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
