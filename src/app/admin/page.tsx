import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Clock, ChevronRight, MessageCircle } from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: adminRows } = await supabase
    .from("circle_admins")
    .select("circle_id, circles(*)")
    .eq("user_id", user!.id);

  const circles = (adminRows?.map((r) => r.circles).filter(Boolean) ?? []) as {
    id: string; name: string; description: string | null;
    category: string; university: string | null;
  }[];

  const circleIds = circles.map((c) => c.id);

  const pendingByCircle: Record<string, number> = {};
  const upcomingByCircle: Record<string, number> = {};
  const unreadMsgByCircle: Record<string, number> = {};

  if (circleIds.length > 0) {
    const [{ data: pendingData }, { data: upcomingData }, { data: reservationData }] = await Promise.all([
      supabase
        .from("reservations")
        .select("events!inner(circle_id)")
        .eq("status", "pending")
        .in("events.circle_id", circleIds),
      supabase
        .from("events")
        .select("id, circle_id")
        .in("circle_id", circleIds)
        .eq("status", "open")
        .gte("date", new Date().toISOString()),
      supabase
        .from("reservations")
        .select("id, events!inner(circle_id)")
        .in("events.circle_id", circleIds),
    ]);

    for (const r of (pendingData ?? [])) {
      const cid = (r.events as { circle_id: string }).circle_id;
      pendingByCircle[cid] = (pendingByCircle[cid] ?? 0) + 1;
    }
    for (const e of (upcomingData ?? [])) {
      upcomingByCircle[e.circle_id] = (upcomingByCircle[e.circle_id] ?? 0) + 1;
    }

    const resIds = (reservationData ?? []).map((r) => r.id);
    if (resIds.length > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: unreadMsgs } = await (supabase as any)
          .from("messages")
          .select("reservation_id")
          .in("reservation_id", resIds)
          .eq("sender_type", "student")
          .is("read_at", null);
        const resCircleMap: Record<string, string> = {};
        for (const r of (reservationData ?? [])) {
          resCircleMap[r.id] = (r.events as { circle_id: string }).circle_id;
        }
        for (const m of (unreadMsgs ?? [])) {
          const cid = resCircleMap[m.reservation_id];
          if (cid) unreadMsgByCircle[cid] = (unreadMsgByCircle[cid] ?? 0) + 1;
        }
      } catch { /* messages table may not exist yet */ }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">担当サークル</h1>

      {circles.length === 0 ? (
        <p className="text-muted-foreground">担当サークルがまだ割り当てられていません。</p>
      ) : (
        <div className="flex flex-col gap-4">
          {circles.map((c) => {
            const pending = pendingByCircle[c.id] ?? 0;
            const upcoming = upcomingByCircle[c.id] ?? 0;
            const unreadMsg = unreadMsgByCircle[c.id] ?? 0;
            const hasAlert = pending > 0 || unreadMsg > 0;
            return (
              <div key={c.id} className={`border rounded-xl p-5 bg-background transition-colors ${hasAlert ? "border-rose-300" : ""}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-semibold text-lg">{c.name}</h2>
                    {c.university && (
                      <p className="text-xs text-muted-foreground mt-0.5">{c.university}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {unreadMsg > 0 && (
                      <Badge className="gap-1 bg-rose-500 hover:bg-rose-500 animate-pulse">
                        <MessageCircle className="size-3" />
                        未読メッセージ {unreadMsg}
                      </Badge>
                    )}
                    {pending > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <Clock className="size-3" />
                        未承認 {pending}
                      </Badge>
                    )}
                    {upcoming > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <CalendarDays className="size-3" />
                        開催予定 {upcoming}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/circles/${c.id}/events`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    イベント管理
                  </Link>
                  <Link
                    href={`/admin/circles/${c.id}/reservations`}
                    className={buttonVariants({ size: "sm", variant: (pending > 0 || unreadMsg > 0) ? "default" : "outline", className: unreadMsg > 0 ? "bg-rose-500 hover:bg-rose-600 border-rose-500" : "" })}
                  >
                    <Users className="size-3.5 mr-1" />
                    予約一覧
                    {(pending > 0 || unreadMsg > 0) && (
                      <span className="ml-1 size-4 rounded-full bg-background/20 text-[10px] flex items-center justify-center font-bold">
                        {pending + unreadMsg}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/admin/circles/${c.id}/profile`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    プロフィール編集
                  </Link>
                  <Link
                    href={`/admin/circles/${c.id}/stats`}
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    統計 <ChevronRight className="size-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
