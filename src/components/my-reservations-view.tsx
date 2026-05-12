"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Reservation = {
  id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  events: {
    id: string;
    title: string;
    date: string;
    location: string | null;
    circles: {
      id: string;
      name: string;
      category: string;
    };
  };
};

const STATUS_INFO = {
  pending:   { label: "審査中",    icon: Clock,       color: "bg-yellow-100 text-yellow-800" },
  approved:  { label: "承認済み",  icon: CheckCircle, color: "bg-green-100 text-green-800" },
  rejected:  { label: "不承認",    icon: XCircle,     color: "bg-red-100 text-red-800" },
  cancelled: { label: "キャンセル済み", icon: Ban,    color: "bg-gray-100 text-gray-600" },
} as const;

function EmailForm({ defaultEmail }: { defaultEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) router.push(`/my-reservations?email=${encodeURIComponent(email.trim())}`);
      }}
      className="max-w-md mx-auto text-center space-y-4 py-12"
    >
      <div className="text-5xl mb-2">📋</div>
      <h2 className="text-xl font-semibold">予約を確認する</h2>
      <p className="text-sm text-muted-foreground">
        予約時に登録したメールアドレスを入力してください
      </p>
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" className="w-full">予約を確認する</Button>
    </form>
  );
}

export function MyReservationsView({
  email,
  reservations,
}: {
  email?: string;
  reservations: Reservation[] | null;
}) {
  const [items, setItems] = useState<Reservation[]>(reservations ?? []);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!email) return <EmailForm />;

  const handleCancel = async (id: string) => {
    if (!confirm("この予約をキャンセルしますか？")) return;
    setCancelling(id);
    setError(null);
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setCancelling(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "キャンセルに失敗しました");
      return;
    }
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r))
    );
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <EmailForm defaultEmail={email} />
        <div className="text-center text-muted-foreground text-sm">
          <p>「{email}」での予約は見つかりませんでした。</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">{email} の予約一覧</h2>
          <p className="text-xs text-muted-foreground">{items.length} 件</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/my-reservations"}>
          別のメールで確認
        </Button>
      </div>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="flex flex-col gap-3">
        {items.map((r) => {
          const s = STATUS_INFO[r.status];
          const StatusIcon = s.icon;
          const ev = r.events;
          const catColor = CATEGORY_COLORS[ev.circles.category] ?? CATEGORY_COLORS.other;
          const catLabel = CATEGORIES[ev.circles.category as keyof typeof CATEGORIES] ?? ev.circles.category;
          const canCancel = r.status === "pending" || r.status === "approved";

          return (
            <div key={r.id} className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                    <StatusIcon className="size-3" />{s.label}
                  </span>
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
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/circles/${ev.circles.id}/events/${ev.id}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  詳細
                </Link>
                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancelling === r.id}
                    onClick={() => handleCancel(r.id)}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                  >
                    {cancelling === r.id ? "処理中..." : "キャンセル"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
