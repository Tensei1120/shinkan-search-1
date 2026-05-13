import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import ReservationActions from "./reservation-actions";

export const revalidate = 0;

const STATUS_LABEL = {
  pending:   { label: "未処理",       variant: "secondary" as const },
  approved:  { label: "承認",         variant: "default" as const },
  rejected:  { label: "却下",         variant: "destructive" as const },
  cancelled: { label: "キャンセル済", variant: "outline" as const },
};

export default async function ReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string }>;
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { circleId } = await params;
  const { eventId } = await searchParams;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("reservations")
    .select("*, events!inner(title, date, circle_id)")
    .eq("events.circle_id", circleId)
    .order("created_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data: reservations } = await query;

  const circleName = (adminRow.circles as { name: string } | null)?.name ?? "";

  const filterEventTitle = eventId && reservations?.length > 0
    ? (reservations[0].events as { title: string } | null)?.title ?? null
    : null;

  // Fetch unread message counts per reservation (student messages admin hasn't read)
  const unreadByReservation: Record<string, number> = {};
  const resIds = (reservations ?? []).map((r: { id: string }) => r.id);
  if (resIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unreadMsgs } = await (supabase as any)
      .from("messages")
      .select("reservation_id")
      .in("reservation_id", resIds)
      .eq("sender_type", "student")
      .is("read_at", null);
    for (const m of (unreadMsgs ?? [])) {
      unreadByReservation[m.reservation_id] = (unreadByReservation[m.reservation_id] ?? 0) + 1;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link
          href={eventId ? `/admin/circles/${circleId}/events` : "/admin"}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {eventId ? "イベント管理に戻る" : "ダッシュボードに戻る"}
        </Link>
        <h1 className="text-2xl font-bold mt-1">
          {circleName} ― {filterEventTitle ? `「${filterEventTitle}」の予約` : "予約一覧"}
        </h1>
        {eventId && (
          <Link
            href={`/admin/circles/${circleId}/reservations`}
            className="text-xs text-muted-foreground hover:underline"
          >
            すべての予約を見る →
          </Link>
        )}
      </div>

      {!reservations || reservations.length === 0 ? (
        <p className="text-muted-foreground">予約はまだありません。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>メール</TableHead>
              <TableHead>学年・学部</TableHead>
              {!eventId && <TableHead>イベント</TableHead>}
              <TableHead>日時</TableHead>
              <TableHead>備考</TableHead>
              <TableHead>状態</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((r: { id: string; name: string; email: string; grade: string; department: string; note: string | null; status: keyof typeof STATUS_LABEL; event_id: string; events: { title: string; date: string } }) => {
              const ev = r.events as { title: string; date: string };
              const s = STATUS_LABEL[r.status];
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">{r.email}</TableCell>
                  <TableCell className="text-sm">
                    {r.grade} / {r.department}
                  </TableCell>
                  {!eventId && <TableCell className="text-sm">{ev.title}</TableCell>}
                  <TableCell className="text-sm">
                    {format(new Date(ev.date), "M/d HH:mm", { locale: ja })}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{r.note ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <ReservationActions
                      reservationId={r.id}
                      currentStatus={r.status}
                      reserveeName={r.name}
                      reserveeEmail={r.email}
                      eventTitle={ev.title}
                      unreadCount={unreadByReservation[r.id] ?? 0}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}