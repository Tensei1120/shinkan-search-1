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

  const circle = adminRow.circles as unknown as {
    id: string; name: string; description: string | null;
    contact_email: string; category: string; university: string | null;
    logo_url: string | null;
    member_count: number | null; admission_fee: number | null; annual_fee: number | null;
    activity_frequency: string | null; gender_ratio: string | null; genre: string | null;
    twitter_url: string | null; instagram_url: string | null; youtube_url: string | null;
    line_url: string | null; website_url: string | null;
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
          logo_url: circle.logo_url ?? undefined,
          member_count: circle.member_count != null ? String(circle.member_count) : "",
          admission_fee: circle.admission_fee != null ? String(circle.admission_fee) : "",
          annual_fee: circle.annual_fee != null ? String(circle.annual_fee) : "",
          activity_frequency: circle.activity_frequency ?? undefined,
          gender_ratio: circle.gender_ratio ?? undefined,
          genre: circle.genre ?? undefined,
          twitter_url: circle.twitter_url ?? undefined,
          instagram_url: circle.instagram_url ?? undefined,
          youtube_url: circle.youtube_url ?? undefined,
          line_url: circle.line_url ?? undefined,
          website_url: circle.website_url ?? undefined,
        }}
      />
    </div>
  );
}
