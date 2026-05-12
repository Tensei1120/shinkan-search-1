import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CircleForm from "@/components/admin/circle-form";

export const revalidate = 0;

export default async function CircleProfilePage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: adminRow } = await supabase
    .from("circle_admins")
    .select("circles(*)")
    .eq("user_id", user.id)
    .eq("circle_id", circleId)
    .single();

  if (!adminRow) notFound();

  const circle = adminRow.circles as {
    id: string; name: string; description: string | null;
    contact_email: string; category: string; university: string | null;
  } | null;

  if (!circle) notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← ダッシュボードに戻る
        </Link>
        <h1 className="text-2xl font-bold mt-1">{circle.name} ― プロフィール編集</h1>
      </div>

      <CircleForm
        circleId={circleId}
        defaultValues={{
          name: circle.name,
          description: circle.description ?? undefined,
          contact_email: circle.contact_email,
          category: circle.category,
          university: circle.university ?? undefined,
        }}
      />
    </div>
  );
}
