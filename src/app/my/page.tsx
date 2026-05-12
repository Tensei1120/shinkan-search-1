import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("id, status, created_at, events(id, title, date, location, circles(id, name, category))")
    .eq("email", profile.email)
    .order("created_at", { ascending: false });

  const reservations = (data ?? []) as Reservation[];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">マイページ</h1>
        <MyPageView profile={profile} reservations={reservations} />
      </main>
    </div>
  );
}
