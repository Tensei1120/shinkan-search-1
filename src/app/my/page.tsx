import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { MyPageView } from "@/components/my-page-view";

export const revalidate = 0;

type Reservation = Parameters<typeof MyPageView>[0]["reservations"][number];

export default async function MyPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("student_profile")?.value;
  if (!raw) redirect("/register");

  const profile = JSON.parse(raw) as {
    email: string;
    name: string;
    furigana?: string;
    university?: string;
    department?: string;
    grade?: string;
    gender?: string;
  };

  const supabase = await createClient();
  const { data } = await supabase
    .from("reservations")
    .select("id, status, created_at, events(id, title, date, location, cancel_deadline, circles(id, name, category, contact_email))")
    .eq("email", profile.email)
    .order("created_at", { ascending: false });

  const reservations = (data ?? []) as Reservation[];

  // Fetch latest message + unread count per reservation
  type MsgInfo = { body: string; sender_type: string; created_at: string; unreadCount: number; latestUnreadAt: string | null };
  let messagesByReservation: Record<string, MsgInfo> = {};

  const reservationIds = reservations.map((r) => r.id);
  if (reservationIds.length > 0) {
    const service = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: msgs } = await (service as any)
      .from("messages")
      .select("reservation_id, body, sender_type, created_at, read_at")
      .in("reservation_id", reservationIds)
      .order("created_at", { ascending: false });

    for (const m of (msgs ?? [])) {
      if (!messagesByReservation[m.reservation_id]) {
        messagesByReservation[m.reservation_id] = {
          body: m.body,
          sender_type: m.sender_type,
          created_at: m.created_at,
          unreadCount: 0,
          latestUnreadAt: null,
        };
      }
      if (m.sender_type === "admin" && !m.read_at) {
        messagesByReservation[m.reservation_id].unreadCount++;
        // msgs are ordered DESC so first unread admin msg = latest
        if (!messagesByReservation[m.reservation_id].latestUnreadAt) {
          messagesByReservation[m.reservation_id].latestUnreadAt = m.created_at;
        }
      }
    }
  }

  // Fetch cancel penalty count
  let penaltyCount = 0;
  try {
    const service2 = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (service2 as any)
      .from("cancel_penalties")
      .select("id", { count: "exact", head: true })
      .eq("email", profile.email);
    penaltyCount = count ?? 0;
  } catch { /* table may not exist yet */ }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">マイページ</h1>
        <MyPageView
          profile={profile}
          reservations={reservations}
          messagesByReservation={messagesByReservation}
          penaltyCount={penaltyCount}
        />
      </main>
    </div>
  );
}
