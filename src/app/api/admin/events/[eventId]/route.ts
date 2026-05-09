import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  status: z.enum(["open", "closed", "cancelled"]).optional(),
});

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = await verifyAdmin(supabase, user.id, eventId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }

  const updates = parsed.data;
  if (updates.date) updates.date = new Date(updates.date).toISOString();

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = await verifyAdmin(supabase, user.id, eventId);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
