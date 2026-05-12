import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";
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

  const catColor = CATEGORY_COLORS[circle.category] ?? CATEGORY_COLORS.other;
  const catLabel = CATEGORIES[circle.category as keyof typeof CATEGORIES] ?? circle.category;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
            {circle.university && (
              <span className="text-sm text-muted-foreground">{circle.university}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold">{circle.name}</h1>
          {circle.description && (
            <p className="text-muted-foreground mt-2">{circle.description}</p>
          )}
        </div>

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
      </main>
    </div>
  );
}
