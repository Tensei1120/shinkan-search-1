import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EventForm from "@/components/admin/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ circleId: string; eventId: string }>;
}) {
  const { circleId, eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("circle_id", circleId)
    .single();

  if (!event) notFound();

  // datetime-local input requires "YYYY-MM-DDTHH:mm" format
  const localDate = new Date(event.date).toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href={`/admin/circles/${circleId}/events`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← イベント一覧に戻る
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">イベント編集</h1>
      <EventForm
        circleId={circleId}
        eventId={eventId}
        defaultValues={{
          title: event.title,
          description: event.description ?? "",
          date: localDate,
          location: event.location ?? "",
          capacity: event.capacity,
          status: event.status,
        }}
      />
    </div>
  );
}
