import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const { data: circles } = await supabase
    .from("circles")
    .select("*, events(count)")
    .order("name");

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

        {!circles || circles.length === 0 ? (
          <p className="text-muted-foreground">現在登録されているサークルはありません。</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {circles.map((circle) => (
              <Link key={circle.id} href={`/circles/${circle.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-base">{circle.name}</CardTitle>
                    {circle.description && (
                      <CardDescription className="line-clamp-2">
                        {circle.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">
                      イベント {(circle.events as unknown as { count: number }[])?.[0]?.count ?? 0} 件
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
