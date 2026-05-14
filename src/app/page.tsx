import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { EventListings } from "@/components/event-listings";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, date, location, capacity, reserved_count, status, tags, circles!inner(id, name, category, university, genre)")
    .neq("status", "cancelled")
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })
    .limit(200);

  type CircleShape = { id: string; name: string; category: string; university: string | null; genre: string | null };

  const rows = (events ?? []).map((ev) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    date: ev.date,
    location: ev.location,
    capacity: ev.capacity,
    reserved_count: ev.reserved_count,
    status: ev.status as "open" | "closed" | "cancelled",
    tags: (ev as unknown as { tags: string | null }).tags,
    circles: ev.circles as unknown as CircleShape,
  }));

  const universities = [...new Set(
    rows.map((r) => r.circles.university).filter((u): u is string => !!u)
  )].sort();

  const allTags = [...new Set(
    rows.flatMap((r) => [
      ...(r.circles.genre ? r.circles.genre.split(",").map((t) => t.trim()).filter(Boolean) : []),
      ...(r.tags ? r.tags.split(",").map((t) => t.trim()).filter(Boolean) : []),
    ])
  )].sort();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">新歓イベントを探す</h1>
          <p className="text-muted-foreground text-sm mt-1">
            気になるイベントを見つけて、今すぐ予約しよう
          </p>
        </div>
        <EventListings events={rows} universities={universities} allTags={allTags} />
      </main>
    </div>
  );
}
