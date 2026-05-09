import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import ReservationForm from "./reservation-form";

export const revalidate = 0;

export default async function EventPage({
  params,
}: {
  params: Promise<{ circleId: string; eventId: string }>;
}) {
  const { circleId, eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, circles(*)")
    .eq("id", eventId)
    .eq("circle_id", circleId)
    .single();

  if (!event) notFound();

  const isFull = event.reserved_count >= event.capacity;
  const isClosed = event.status === "closed" || event.status === "cancelled";
  const unavailable = isFull || isClosed;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <Link href={`/circles/${circleId}`} className="text-sm text-muted-foreground hover:underline">
          ← {(event.circles as { name: string }).name} のイベント一覧に戻る
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            {unavailable ? (
              <Badge variant="destructive">受付終了</Badge>
            ) : (
              <Badge variant="secondary">残り {event.capacity - event.reserved_count} 席</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {format(new Date(event.date), "M月d日(E) HH:mm", { locale: ja })}
            {event.location && ` ・ ${event.location}`}
          </p>
          {event.description && (
            <p className="mt-4 text-sm whitespace-pre-line">{event.description}</p>
          )}
        </div>

        {unavailable ? (
          <p className="text-muted-foreground">このイベントは現在受付を終了しています。</p>
        ) : (
          <ReservationForm eventId={event.id} eventTitle={event.title} />
        )}
      </div>
    </main>
  );
}
