import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: adminRows } = await supabase
    .from("circle_admins")
    .select("circle_id, circles(*)")
    .eq("user_id", user!.id);

  const circles = adminRows?.map((r) => r.circles).filter(Boolean) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">担当サークル</h1>
      </div>

      {circles.length === 0 ? (
        <p className="text-muted-foreground">担当サークルがまだ割り当てられていません。</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {circles.map((circle) => {
            const c = circle as { id: string; name: string; description: string | null };
            return (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Link href={`/admin/circles/${c.id}/events`} className={buttonVariants({ size: "sm" })}>
                    イベント管理
                  </Link>
                  <Link href={`/admin/circles/${c.id}/reservations`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    予約一覧
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
