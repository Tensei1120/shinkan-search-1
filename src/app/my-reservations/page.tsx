import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { MyReservationsView } from "@/components/my-reservations-view";

export const revalidate = 0;

export default async function MyReservationsPage({
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
      .select("id, status, created_at, events(id, title, date, location, circles(id, name, category))")
      .eq("email", email)
      .order("created_at", { ascending: false });
    reservations = data as Parameters<typeof MyReservationsView>[0]["reservations"];
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">マイ予約</h1>
        <MyReservationsView email={email} reservations={reservations} />
      </main>
    </div>
  );
}
