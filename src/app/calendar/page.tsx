import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ReservationCalendar } from "@/components/reservation-calendar";

export const revalidate = 0;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  let reservations = null;

  if (email) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reservations")
      .select("id, status, events(id, title, date, location, circles(id, name))")
      .eq("email", email)
      .order("events(date)", { ascending: true });
    reservations = data as Parameters<typeof ReservationCalendar>[0]["reservations"];
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">予約カレンダー</h1>
        <ReservationCalendar email={email} reservations={reservations} />
      </main>
    </div>
  );
}
