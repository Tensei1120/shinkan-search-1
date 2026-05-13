import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { CircleListings } from "@/components/circle-listings";

export const revalidate = 60;

export default async function CirclesPage() {
  const supabase = await createClient();

  const [{ data: circles }, { data: eventRows }] = await Promise.all([
    supabase
      .from("circles")
      .select("id, name, description, category, university, logo_url")
      .order("name"),
    supabase
      .from("events")
      .select("circle_id")
      .neq("status", "cancelled")
      .gte("date", new Date().toISOString()),
  ]);

  const countMap = new Map<string, number>();
  (eventRows ?? []).forEach((e) => {
    countMap.set(e.circle_id, (countMap.get(e.circle_id) ?? 0) + 1);
  });

  const rows = (circles ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category,
    university: c.university,
    logo_url: c.logo_url,
    event_count: countMap.get(c.id) ?? 0,
  }));

  const universities = [
    ...new Set(rows.map((r) => r.university).filter((u): u is string => !!u)),
  ].sort();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">団体一覧</h1>
          <p className="text-muted-foreground text-sm mt-1">
            登録されているサークル・部活動団体を探す
          </p>
        </div>
        <CircleListings circles={rows} universities={universities} />
      </main>
    </div>
  );
}
