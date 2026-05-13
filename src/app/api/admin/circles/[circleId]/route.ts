import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const urlOpt = z.string().url().optional().or(z.literal(""));
const toIntOrNull = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : parseInt(String(v), 10)),
  z.number().int().nonnegative().nullable().optional()
);

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  university: z.string().optional(),
  contact_email: z.string().email().optional(),
  logo_url: urlOpt,
  member_count: toIntOrNull,
  admission_fee: toIntOrNull,
  annual_fee: toIntOrNull,
  activity_frequency: z.string().optional(),
  gender_ratio: z.string().optional(),
  genre: z.string().optional(),
  twitter_url: urlOpt,
  instagram_url: urlOpt,
  youtube_url: urlOpt,
  line_url: urlOpt,
  website_url: urlOpt,
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const { circleId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase
    .from("circle_admins")
    .select("id")
    .eq("user_id", user.id)
    .eq("circle_id", circleId)
    .single();

  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("circles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", circleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
