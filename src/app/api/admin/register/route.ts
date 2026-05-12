import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  circleName: z.string().min(1),
  adminName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  university: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const { circleName, adminName, email, password, university } = parsed.data;
  const service = createServiceClient();

  // 1. Create auth user
  const { data: userData, error: userError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: adminName },
  });

  if (userError) {
    const msg = userError.message.includes("already registered")
      ? "このメールアドレスはすでに登録されています"
      : userError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = userData.user.id;

  // 2. Create circle
  const { data: circle, error: circleError } = await service
    .from("circles")
    .insert({
      name: circleName,
      university: university,
      category: "other",
      contact_email: email,
    })
    .select("id")
    .single();

  if (circleError || !circle) {
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "サークルの作成に失敗しました" }, { status: 500 });
  }

  // 3. Link admin to circle
  const { error: adminError } = await service
    .from("circle_admins")
    .insert({ user_id: userId, circle_id: circle.id });

  if (adminError) {
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "管理者の登録に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
