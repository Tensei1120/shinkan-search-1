import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  name: z.string().min(1),
  body: z.string().min(1),
  eventTitle: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { to, name, body, eventTitle } = parsed.data;

  await sendEmail({
    to,
    subject: `【${eventTitle}】サークルよりご連絡`,
    html: `<p>${name} 様</p><p>${body.replace(/\n/g, "<br>")}</p>`,
  });

  return NextResponse.json({ ok: true });
}
