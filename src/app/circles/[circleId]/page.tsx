import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export const revalidate = 60;

export default async function CirclePage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const supabase = await createClient();

  const [{ data: circle }, { data: events }] = await Promise.all([
    supabase.from("circles").select("*").eq("id", circleId).single(),
    supabase
      .from("events")
      .select("*")
      .eq("circle_id", circleId)
      .neq("status", "cancelled")
      .order("date"),
  ]);

  if (!circle) notFound();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← サークル一覧に戻る
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">{circle.name}</h1>
        {circle.description && (
          <p className="text-muted-foreground mb-8">{circle.description}</p>
        )}

        <h2 className="text-xl font-semibold mb-4">開催予定のイベント</h2>

        {!events || events.length === 0 ? (
          <p className="text-muted-foreground">現在募集中のイベントはありません。</p>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map((event) => {
              const isFull = event.reserved_count >= event.capacity;
              const isClosed = event.status === "closed";
              const unavailable = isFull || isClosed;

              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {unavailable ? (
                        <Badge variant="destructive">満員</Badge>
                      ) : (
                        <Badge variant="secondary">
                          残り {event.capacity - event.reserved_count} 席
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {format(new Date(event.date), "M月d日(E) HH:mm", { locale: ja })}
                      {event.location && ` ・ ${event.location}`}
                    </CardDescription>
                  </CardHeader>
                  {event.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {event.description}
                      </p>
                    </CardContent>
                  )}
                  <CardContent className="pt-0">
                    {unavailable ? (
                      <span className={buttonVariants({ variant: "secondary" }) + " opacity-50 cursor-not-allowed w-full sm:w-auto"}>
                        受付終了
                      </span>
                    ) : (
                      <Link
                        href={`/circles/${circleId}/events/${event.id}`}
                        className={buttonVariants() + " w-full sm:w-auto"}
                      >
                        予約する
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
