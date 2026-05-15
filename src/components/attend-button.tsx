"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle } from "lucide-react";

export function AttendButton({
  reservationId,
  email,
  initialAttended,
}: {
  reservationId: string;
  email: string;
  initialAttended: boolean;
}) {
  const [attended, setAttended] = useState(initialAttended);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!confirm(attended ? "出席を取り消しますか？" : "出席を登録しますか？")) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/reservations/${reservationId}/attend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "エラーが発生しました");
      return;
    }
    const j = await res.json();
    setAttended(j.attended);
  };

  return (
    <div className="space-y-1">
      <Button
        onClick={handleToggle}
        disabled={loading}
        variant={attended ? "default" : "outline"}
        className={attended ? "bg-green-600 hover:bg-green-700 border-green-600 w-full" : "w-full"}
      >
        {attended ? (
          <><CheckCircle className="size-4 mr-2" />出席済み</>
        ) : (
          <><Circle className="size-4 mr-2" />出席する</>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
