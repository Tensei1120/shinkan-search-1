import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  circleId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  location: z.string().optional(),
  capacity: z.coerce.number().int().min(1),
  status: z.enum(["open", "closed", "cancelled"]).default("open"),
  tags: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }

  const { circleId, ...rest } = parsed.data;

  // Verify admin owns this circle
  const { data: admin } = await supabase
    .from("circle_admins")
    .select("id")
    .eq("user_id", user.id)
    .eq("circle_id", circleId)
    .single();

  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("events").insert({
    circle_id: circleId,
    ...rest,
    date: new Date(rest.date + "+09:00").toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
