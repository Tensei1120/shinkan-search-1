import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import EventActions from "./event-actions";
import { CalendarDays, ChevronRight, MapPin, Users, MessageCircle } from "lucide-react";

export const revalidate = 0;

const STATUS_LABEL = {
  open:      { label: "受付中",   variant: "default" as const },
  closed:    { label: "受付終了", variant: "secondary" as const },
  cancelled: { label: "中止",     variant: "destructive" as const },
};

export default async function AdminEventsPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: adminRow } = await supabase
    .from("circle_admins")
    .select("id, circles(name)")
    .eq("user_id", user.id)
    .eq("circle_id", circleId)
    .single();

  if (!adminRow) notFound();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("circle_id", circleId)
    .order("date", { ascending: false });

  const circleName = (adminRow.circles as { name: string } | null)?.name ?? "";

  const eventIds = (events ?? []).map((e) => e.id);
  const resByEvent: Record<string, { pending: number; approved: number; rejected: number; cancelled: number }> = {};
  const unreadByEvent: Record<string, number> = {};

  if (eventIds.length > 0) {
    const { data: resData } = await supabase
      .from("reservations")
      .select("id, event_id, status")
      .in("event_id", eventIds);

    for (const r of (resData ?? [])) {
      if (!resByEvent[r.event_id]) {
        resByEvent[r.event_id] = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
      }
      const key = r.status as keyof typeof resByEvent[string];
      if (key in resByEvent[r.event_id]) resByEvent[r.event_id][key]++;
    }

    const resIds = (resData ?? []).map((r) => r.id);
    if (resIds.length > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: unreadMsgs } = await (supabase as any)
          .from("messages")
          .select("reservation_id")
          .in("reservation_id", resIds)
          .eq("sender_type", "student")
          .is("read_at", null);
        const resEventMap: Record<string, string> = {};
        for (const r of (resData ?? [])) resEventMap[r.id] = r.event_id;
        for (const m of (unreadMsgs ?? [])) {
          const eid = resEventMap[m.reservation_id];
          if (eid) unreadByEvent[eid] = (unreadByEvent[eid] ?? 0) + 1;
        }
      } catch { /* messages table may not exist yet */ }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-2xl font-bold mt-1">{circleName} ― イベント管理</h1>
        </div>
        <Link href={`/admin/circles/${circleId}/events/new`} className={buttonVariants()}>
          ＋ 新規イベント
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <p className="text-muted-foreground">イベントはまだありません。</p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((ev) => {
            const s = STATUS_LABEL[ev.status as keyof typeof STATUS_LABEL] ?? STATUS_LABEL.open;
            const stats = resByEvent[ev.id] ?? { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
            const unreadMsg = unreadByEvent[ev.id] ?? 0;
            const fillPct = ev.capacity > 0
              ? Math.min(100, Math.round((ev.reserved_count / ev.capacity) * 100))
              : 0;
            const isFull = ev.reserved_count >= ev.capacity;

            return (
              <div key={ev.id} className={`border rounded-xl bg-background grid grid-cols-[1fr_auto] overflow-hidden ${unreadMsg > 0 ? "border-rose-300" : ""}`}>
                {/* Clickable main area */}
                <Link
                  href={`/admin/circles/${circleId}/reservations?eventId=${ev.id}`}
                  className="p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                        {unreadMsg > 0 && (
                          <Badge className="text-xs gap-1 bg-rose-500 hover:bg-rose-500">
                            <MessageCircle className="size-3" />
                            未読 {unreadMsg}
                          </Badge>
                        )}
                        {stats.pending > 0 && (
                          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
                            未承認 {stats.pending}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold truncate">{ev.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {format(new Date(ev.date), "M/d(E) HH:mm", { locale: ja })}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />{ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {ev.reserved_count} / {ev.capacity} 席
                        {isFull && <span className="text-destructive font-medium ml-1">（満員）</span>}
                      </span>
                      <span className="flex gap-2">
                        <span className="text-green-600">承認 {stats.approved}</span>
                        <span className="text-yellow-600">審査中 {stats.pending}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? "bg-destructive" : fillPct > 80 ? "bg-yellow-500" : "bg-primary"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                </Link>

                {/* Edit/Delete buttons — not part of the link */}
                <div className="flex flex-col items-end justify-start gap-2 p-4 pl-2 border-l">
                  <EventActions eventId={ev.id} circleId={circleId} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
