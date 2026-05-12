"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth, getDay } from "date-fns";
import { ja } from "date-fns/locale";

type Reservation = {
  id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  events: {
    id: string;
    title: string;
    date: string;
    location: string | null;
    circles: { id: string; name: string };
  };
};

const DOT_COLORS: Record<string, string> = {
  approved:  "bg-green-500",
  pending:   "bg-yellow-500",
  rejected:  "bg-red-400",
  cancelled: "bg-gray-300",
};

function EmailPrompt() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) router.push(`/calendar?email=${encodeURIComponent(email.trim())}`);
      }}
      className="max-w-md mx-auto text-center space-y-4 py-16"
    >
      <div className="text-5xl mb-2">📅</div>
      <h2 className="text-xl font-semibold">予約カレンダー</h2>
      <p className="text-sm text-muted-foreground">
        予約時のメールアドレスを入力して、カレンダーを表示しましょう
      </p>
      <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" className="w-full">カレンダーを表示する</Button>
    </form>
  );
}

export function ReservationCalendar({ email, reservations }: { email?: string; reservations: Reservation[] | null }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  if (!email) return <EmailPrompt />;

  const active = (reservations ?? []).filter((r) => r.status !== "cancelled" && r.status !== "rejected");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const reservationsOnDay = (day: Date) =>
    active.filter((r) => isSameDay(new Date(r.events.date), day));

  const selectedReservations = selectedDay ? reservationsOnDay(selectedDay) : [];

  const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-semibold">{email} のカレンダー</h2>
          <p className="text-xs text-muted-foreground">承認・審査中の予約を表示</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/calendar"}>
          変更
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <h3 className="font-semibold text-lg">
          {format(currentMonth, "yyyy年M月", { locale: ja })}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div>
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className={`text-center text-xs font-medium py-1 ${w === "日" ? "text-red-500" : w === "土" ? "text-blue-500" : "text-muted-foreground"}`}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-muted/30 min-h-[52px] p-1" />
          ))}
          {days.map((day) => {
            const rsvs = reservationsOnDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const dow = getDay(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={[
                  "bg-background min-h-[52px] p-1 text-left transition-colors relative",
                  isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50",
                  !isCurrentMonth ? "opacity-30" : "",
                ].join(" ")}
              >
                <span className={[
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-primary text-primary-foreground" : dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "",
                ].join(" ")}>
                  {format(day, "d")}
                </span>
                {rsvs.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {rsvs.slice(0, 3).map((r) => (
                      <span key={r.id} className={`size-1.5 rounded-full ${DOT_COLORS[r.status] ?? "bg-primary"}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" />承認済み</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-yellow-500" />審査中</span>
      </div>

      {selectedDay && (
        <div>
          <h4 className="font-semibold mb-3 text-sm">
            {format(selectedDay, "M月d日(E)", { locale: ja })} の予約
          </h4>
          {selectedReservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">予約はありません</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedReservations.map((r) => (
                <Link
                  key={r.id}
                  href={`/circles/${r.events.circles.id}/events/${r.events.id}`}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors space-y-1"
                >
                  <p className="text-xs text-muted-foreground">{r.events.circles.name}</p>
                  <p className="font-medium text-sm">{r.events.title}</p>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {format(new Date(r.events.date), "HH:mm", { locale: ja })}
                    </span>
                    {r.events.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />{r.events.location}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
