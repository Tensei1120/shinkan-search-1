"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, CalendarDays, MapPin,
  CheckCircle, XCircle, Clock, Ban, User, MessageCircle, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";

type StudentProfile = {
  email: string;
  name: string;
  furigana?: string;
  university?: string;
  department?: string;
  grade?: string;
  gender?: string;
};

type Reservation = {
  id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  events: {
    id: string;
    title: string;
    date: string;
    location: string | null;
    cancel_deadline: string | null;
    circles: { id: string; name: string; category: string; contact_email: string };
  };
};

type Message = {
  id: string;
  sender_type: "admin" | "student";
  body: string;
  created_at: string;
  read_at: string | null;
};

const DOT_COLORS: Record<string, string> = {
  approved:  "bg-green-500",
  pending:   "bg-yellow-500",
  rejected:  "bg-red-400",
  cancelled: "bg-gray-300",
};

const STATUS_INFO = {
  pending:   { label: "審査中",        icon: Clock,       color: "bg-yellow-100 text-yellow-800" },
  approved:  { label: "承認済み",      icon: CheckCircle, color: "bg-green-100 text-green-800" },
  rejected:  { label: "不承認",        icon: XCircle,     color: "bg-red-100 text-red-800" },
  cancelled: { label: "キャンセル済み", icon: Ban,         color: "bg-gray-100 text-gray-600" },
} as const;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function MessageDialog({
  reservation,
  studentEmail,
  onClose,
}: {
  reservation: Reservation;
  studentEmail: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/messages?reservationId=${reservation.id}&email=${encodeURIComponent(studentEmail)}`
    );
    if (res.ok) {
      const json = await res.json();
      setMessages(json.messages ?? []);
      router.refresh();
    }
    setLoading(false);
  }, [reservation.id, studentEmail, router]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const sendMessage = async () => {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId: reservation.id,
        body: body.trim(),
        senderType: "student",
        email: studentEmail,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setMessages((prev) => [...prev, json.message]);
      setBody("");
    }
    setSending(false);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {reservation.events.circles.name} からのメッセージ
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">{reservation.events.title}</p>

        {/* Thread */}
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto py-2 px-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">読み込み中…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">メッセージはまだありません</p>
          ) : (
            messages.map((m) => {
              const isStudent = m.sender_type === "student";
              return (
                <div key={m.id} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      isStudent
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.body}
                    <div className={`text-[10px] mt-1 ${isStudent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {format(new Date(m.created_at), "M/d HH:mm", { locale: ja })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply */}
        <div className="flex gap-2 mt-2">
          <Textarea
            rows={2}
            className="resize-none"
            placeholder="返信を入力…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage(); }}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={sending || !body.trim()}
            className="shrink-0 self-end"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">⌘ + Enter で送信</p>
      </DialogContent>
    </Dialog>
  );
}

const LAST_READ_KEY = "my_last_read";

type MsgInfo = { body: string; sender_type: string; created_at: string; unreadCount: number; latestUnreadAt: string | null };

export function MyPageView({
  profile,
  reservations: initial,
  messagesByReservation = {},
  penaltyCount = 0,
}: {
  profile: StudentProfile;
  reservations: Reservation[];
  messagesByReservation?: Record<string, MsgInfo>;
  penaltyCount?: number;
}) {
  const [reservations, setReservations] = useState(initial);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [msgReservation, setMsgReservation] = useState<Reservation | null>(null);
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_READ_KEY);
      if (stored) setLastReadMap(JSON.parse(stored));
    } catch {}
  }, []);

  const markRead = (id: string) => {
    const now = new Date().toISOString();
    setLastReadMap((prev) => {
      const next = { ...prev, [id]: now };
      try { localStorage.setItem(LAST_READ_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const active = reservations.filter(
    (r) => r.status !== "cancelled" && r.status !== "rejected"
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const onDay = (day: Date) =>
    active.filter((r) => isSameDay(new Date(r.events.date), day));

  const selectedRsvs = selectedDay ? onDay(selectedDay) : [];

  const handleCancel = async (id: string) => {
    if (!confirm("この予約をキャンセルしますか？")) return;
    setCancelling(id);
    setCancelError(null);
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email }),
    });
    setCancelling(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setCancelError(j.error ?? "キャンセルに失敗しました");
      return;
    }
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r))
    );
  };

  const meta = [profile.university, profile.department, profile.grade]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="space-y-10">
      {/* Profile card */}
      <div className="border rounded-xl p-4 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{profile.name}</p>
            {profile.furigana && (
              <p className="text-xs text-muted-foreground">{profile.furigana}</p>
            )}
            <p className="text-xs text-muted-foreground">{profile.email}</p>
            {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
            {penaltyCount > 0 && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                ⚠️ キャンセルポイント：{penaltyCount}pt
              </p>
            )}
          </div>
        </div>
        <Link
          href="/register?edit=1"
          className="text-xs text-muted-foreground hover:underline shrink-0 ml-4"
        >
          編集
        </Link>
      </div>

      {/* Calendar */}
      <div>
        <h2 className="text-lg font-semibold mb-4">予約カレンダー</h2>
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-semibold">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className={`text-center text-xs font-medium py-1 ${
                w === "日" ? "text-red-500" : w === "土" ? "text-blue-500" : "text-muted-foreground"
              }`}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-muted/30 min-h-[52px] p-1" />
          ))}
          {days.map((day) => {
            const rsvs = onDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const dow = getDay(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={[
                  "bg-background min-h-[52px] p-1 text-left transition-colors",
                  isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-primary-foreground"
                      : dow === 0 ? "text-red-500"
                      : dow === 6 ? "text-blue-500"
                      : "",
                  ].join(" ")}
                >
                  {format(day, "d")}
                </span>
                {rsvs.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {rsvs.slice(0, 3).map((r) => (
                      <span
                        key={r.id}
                        className={`size-1.5 rounded-full ${DOT_COLORS[r.status] ?? "bg-primary"}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" />承認済み</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-yellow-500" />審査中</span>
        </div>

        {selectedDay && (
          <div className="mt-4 border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">
              {format(selectedDay, "M月d日(E)", { locale: ja })} の予約
            </h4>
            {selectedRsvs.length === 0 ? (
              <p className="text-sm text-muted-foreground">予約はありません</p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedRsvs.map((r) => (
                  <Link
                    key={r.id}
                    href={`/circles/${r.events.circles.id}/events/${r.events.id}`}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors space-y-1"
                  >
                    <p className="text-xs text-muted-foreground">{r.events.circles.name}</p>
                    <p className="font-medium text-sm">{r.events.title}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {format(new Date(r.events.date), "HH:mm")}
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

      {/* Reservation list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">予約一覧</h2>
        {cancelError && <p className="text-sm text-destructive mb-3">{cancelError}</p>}
        {reservations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">まだ予約がありません。</p>
            <Link href="/" className="text-sm text-primary hover:underline mt-2 inline-block">
              イベントを探す →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reservations.map((r) => {
              const s = STATUS_INFO[r.status];
              const StatusIcon = s.icon;
              const ev = r.events;
              const catColor = CATEGORY_COLORS[ev.circles.category] ?? CATEGORY_COLORS.other;
              const catLabel = CATEGORIES[ev.circles.category as keyof typeof CATEGORIES] ?? ev.circles.category;
              const deadlinePassed =
                ev.cancel_deadline != null && new Date() > new Date(ev.cancel_deadline);
              const canCancel = r.status === "pending" || r.status === "approved";

              const msgInfo = messagesByReservation[r.id];
              const hasUnread = msgInfo && msgInfo.unreadCount > 0 &&
                (!lastReadMap[r.id] || (msgInfo.latestUnreadAt != null && msgInfo.latestUnreadAt > lastReadMap[r.id]));

              return (
                <div key={r.id} className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3 transition-colors ${hasUnread ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20" : ""}`}>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                        <StatusIcon className="size-3" />{s.label}
                      </span>
                      {hasUnread && (
                        <span className="relative flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                          <span className="animate-ping absolute inset-0 rounded-full bg-rose-400 opacity-50" />
                          <MessageCircle className="size-3 relative" />
                          <span className="relative">新着メッセージ {msgInfo.unreadCount}件</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.circles.name}</p>
                    <p className="font-semibold leading-snug">{ev.title}</p>
                    <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {format(new Date(ev.date), "M月d日(E) HH:mm", { locale: ja })}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5" />{ev.location}
                        </span>
                      )}
                      {ev.cancel_deadline && (r.status === "pending" || r.status === "approved") && (
                        <span className={`flex items-center gap-1.5 text-xs ${deadlinePassed ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>
                          <Ban className="size-3.5" />
                          キャンセル期限：{format(new Date(ev.cancel_deadline), "M月d日(E) HH:mm", { locale: ja })}
                          {deadlinePassed && "（期限後はポイントが付きます）"}
                        </span>
                      )}
                    </div>
                    {/* Latest message preview */}
                    {msgInfo && (
                      <button
                        onClick={() => setMsgReservation(r)}
                        className={`mt-1 w-full text-left flex items-start gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                          hasUnread
                            ? "bg-rose-100 border border-rose-200 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:border-rose-800"
                            : "bg-muted/60 hover:bg-muted"
                        }`}
                      >
                        <MessageCircle className={`size-3.5 shrink-0 mt-0.5 ${hasUnread ? "text-rose-500" : "text-muted-foreground"}`} />
                        <span className="flex-1 min-w-0">
                          <span className={`font-medium ${hasUnread ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"}`}>
                            {msgInfo.sender_type === "admin" ? ev.circles.name : "あなた"}：
                          </span>
                          <span className="text-muted-foreground line-clamp-1">{msgInfo.body}</span>
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(msgInfo.created_at), "M/d", { locale: ja })}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/circles/${ev.circles.id}/events/${ev.id}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        詳細
                      </Link>
                      {canCancel && (
                        <Button
                          variant="outline" size="sm"
                          disabled={cancelling === r.id}
                          onClick={() => handleCancel(r.id)}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                        >
                          {cancelling === r.id ? "処理中..." : "キャンセル"}
                        </Button>
                      )}
                    </div>
                    <Button
                      variant={hasUnread ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${hasUnread ? "bg-rose-500 hover:bg-rose-600 border-rose-500" : ""}`}
                      onClick={() => setMsgReservation(r)}
                    >
                      <MessageCircle className="size-3 mr-1" />
                      メッセージ
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message dialog */}
      {msgReservation && (
        <MessageDialog
          reservation={msgReservation}
          studentEmail={profile.email}
          onClose={() => {
            markRead(msgReservation.id);
            setMsgReservation(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
