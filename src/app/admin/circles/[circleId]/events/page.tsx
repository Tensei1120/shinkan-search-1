import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
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
import EventActions from "./event-actions";

export const revalidate = 0;

const STATUS_LABEL = {
  open: { label: "受付中", variant: "default" as const },
  closed: { label: "受付終了", variant: "secondary" as const },
  cancelled: { label: "中止", variant: "destructive" as const },
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

  // Verify admin owns this circle
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>日時</TableHead>
              <TableHead>定員</TableHead>
              <TableHead>予約数</TableHead>
              <TableHead>状態</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev) => {
              const s = STATUS_LABEL[ev.status];
              return (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{ev.title}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(ev.date), "M/d(E) HH:mm", { locale: ja })}
                  </TableCell>
                  <TableCell>{ev.capacity}</TableCell>
                  <TableCell>{ev.reserved_count}</TableCell>
                  <TableCell>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <EventActions eventId={ev.id} circleId={circleId} />
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
