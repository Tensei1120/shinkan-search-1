import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const revalidate = 0;

export default async function CircleStatsPage({
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

  const circleName = (adminRow.circles as { name: string } | null)?.name ?? "";

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, capacity, reserved_count, status")
    .eq("circle_id", circleId)
    .order("date", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);

  const { data: reservations } = await supabase
    .from("reservations")
    .select("id, event_id, status, name, email, grade, department")
    .in("event_id", eventIds.length > 0 ? eventIds : ["none"]);

  const allRes = reservations ?? [];

  const total = allRes.length;
  const pending = allRes.filter((r) => r.status === "pending").length;
  const approved = allRes.filter((r) => r.status === "approved").length;
  const rejected = allRes.filter((r) => r.status === "rejected").length;
  const cancelled = allRes.filter((r) => r.status === "cancelled").length;

  const resByEvent: Record<string, typeof allRes> = {};
  for (const r of allRes) {
    (resByEvent[r.event_id] ??= []).push(r);
  }

  const activeRes = allRes.filter((r) => r.status === "pending" || r.status === "approved");
  const gradeCount: Record<string, number> = {};
  for (const r of activeRes) {
    const g = r.grade || "未回答";
    gradeCount[g] = (gradeCount[g] ?? 0) + 1;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← ダッシュボードに戺る
        </Link>
        <h1 className="text-2xl font-bold mt-1">{circleName} ― 統計</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "総予約数", value: total, color: "text-foreground" },
          { label: "承認済み", value: approved, color: "text-green-600" },
          { label: "審査中", value: pending, color: "text-yellow-600" },
          { label: "キャンセル", value: cancelled + rejected, color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="border rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {Object.keys(gradeCount).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">学年別（承認済み＋審査中）</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gradeCount)
              .sort((a, b) => b[1] - a[1])
              .map(([grade, count]) => (
                <div key={grade} className="border rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">{grade}</span>
                  <span className="font-semibold">{count}名</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">イベント別集計</h2>
        {(events ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">イベントはまだありません。</p>
        ) : (
          <div className="flex flex-col gap-4">
            {(events ?? []).map((ev) => {
              const evRes = resByEvent[ev.id] ?? [];
              const evApproved = evRes.filter((r) => r.status === "approved").length;
              const evPending = evRes.filter((r) => r.status === "pending").length;
              const fillPct = ev.capacity > 0
                ? Math.min(100, Math.round((ev.reserved_count / ev.capacity) * 100))
                : 0;

              return (
                <div key={ev.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ev.date), "M月d日(E) HH:mm", { locale: ja })}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {evPending > 0 && (
                        <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">
                          審査中 {evPending}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        承認 {evApproved} / {ev.capacity}
                      </Badge>
                    </div>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>

                  {evRes.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground text-xs">
                        予約者一覧 ({evRes.length}名)
                      </summary>
                      <Table className="mt-2">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">氏名</TableHead>
                            <TableHead className="text-xs">メール</TableHead>
                            <TableHead className="text-xs">学年</TableHead>
                            <TableHead className="text-xs">学部</TableHead>
                            <TableHead className="text-xs">状態</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evRes.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs py-1.5">{r.name}</TableCell>
                              <TableCell className="text-xs py-1.5">{r.email}</TableCell>
                              <TableCell className="text-xs py-1.5">{r.grade ?? "—"}</TableCell>
                              <TableCell className="text-xs py-1.5">{r.department ?? "—"}</TableCell>
                              <TableCell className="text-xs py-1.5">
                                <span className={
                                  r.status === "approved" ? "text-green-600" :
                                  r.status === "pending"  ? "text-yellow-600" :
                                  "text-muted-foreground"
                                }>
                                  {r.status === "approved" ? "承認" :
                                   r.status === "pending"  ? "審査中" :
                                   r.status === "rejected" ? "却下" : "キャンセル"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
