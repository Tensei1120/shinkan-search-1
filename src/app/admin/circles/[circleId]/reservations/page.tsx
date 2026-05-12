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
  pending:   { label: "未処理",         variant: "secondary" as const },
  approved:  { label: "承認",           variant: "default" as const },
  rejected:  { label: "却下",           variant: "destructive" as const },
  cancelled: { label: "キャンセル済み", variant: "secondary" as const },
};

export default async function ReservationsPage({
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

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, events!inner(title, date, circle_id)")
    .eq("events.circle_id", circleId)
    .order("created_at", { ascending: false });

  const circleName = (adminRow.circles as { name: string } | null)?.name ?? "";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← ダッシュボードに戺る
        </Link>
        <h1 className="text-2xl font-bold mt-1">{circleName} ― 予約一覧</h1>
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
              <TableHead>イベント</TableHead>
              <TableHead>日時</TableHead>
              <TableHead>備考</TableHead>
              <TableHead>状態</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((r) => {
              const ev = r.events as { title: string; date: string };
              const s = STATUS_LABEL[r.status];
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">{r.email}</TableCell>
                  <TableCell className="text-sm">
                    {r.grade} / {r.department}
                  </TableCell>
                  <TableCell className="text-sm">{ev.title}</TableCell>
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
