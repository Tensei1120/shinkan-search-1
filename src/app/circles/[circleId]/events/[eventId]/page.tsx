import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import ReservationForm from "./reservation-form";
import { AttendButton } from "@/components/attend-button";

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

  const cookieStore = await cookies();
  const raw = cookieStore.get("student_profile")?.value;
  const profile = raw
    ? (JSON.parse(raw) as { name: string; email: string; furigana?: string; grade?: string; department?: string })
    : null;

  const isFull = event.reserved_count >= event.capacity;
  const isClosed = event.status === "closed" || event.status === "cancelled";
  const unavailable = isFull || isClosed;

  const circle = event.circles as { name: string; contact_email: string };

  // Check if today (JST) matches the event day (JST)
  const toJSTDate = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  };
  const nowJSTDate = toJSTDate(new Date().toISOString());
  const eventJSTDate = toJSTDate(event.date);
  const isEventDay = nowJSTDate === eventJSTDate;

  // Fetch the student's approved reservation for this event
  let approvedReservation: { id: string; attended_at: string | null } | null = null;
  if (profile?.email && isEventDay) {
    const service = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (service as any)
      .from("reservations")
      .select("id, attended_at")
      .eq("event_id", eventId)
      .eq("email", profile.email)
      .eq("status", "approved")
      .single();
    approvedReservation = data ?? null;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <Link href={`/circles/${circleId}`} className="text-sm text-muted-foreground hover:underline">
          ← {circle.name} のイベント一覧に戻る
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

        {approvedReservation && (
          <div className="mb-6 p-4 border rounded-xl bg-green-50 dark:bg-green-950/20 space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              本日のイベントに承認済みです
            </p>
            <AttendButton
              reservationId={approvedReservation.id}
              email={profile!.email}
              initialAttended={approvedReservation.attended_at !== null}
            />
          </div>
        )}

        {unavailable ? (
          <p className="text-muted-foreground">このイベントは現在受付を終了しています。</p>
        ) : (
          <ReservationForm
            eventId={event.id}
            eventTitle={event.title}
            profile={profile}
            circleName={circle.name}
            circleEmail={circle.contact_email}
          />
        )}
      </div>
    </main>
  );
}
