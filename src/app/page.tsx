import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CircleSearch } from "@/components/circle-search";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const { data: circles } = await supabase
    .from("circles")
    .select("*, events(count)")
    .order("name");

  const circleList = (circles ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    events: (c.events as unknown as { count: number }[]) ?? [],
  }));

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">新歓イベント予約</h1>
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          サークル管理者の方はこちら
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-lg font-semibold mb-6 text-muted-foreground">
          参加したいサークルを選んでください
        </h2>

        <CircleSearch circles={circleList} />
      </div>
    </main>
  );
}
