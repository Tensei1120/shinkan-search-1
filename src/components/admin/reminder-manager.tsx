"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, X, Plus } from "lucide-react";

interface Reminder {
  id: string;
  hours_before: number;
}

const PRESETS = [1, 3, 6, 12, 24, 48, 72] as const;

function hoursLabel(h: number) {
  if (h % 24 === 0) return `${h / 24}日前`;
  return `${h}時間前`;
}

export default function ReminderManager({ eventId }: { eventId: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/events/${eventId}/reminders`);
    if (res.ok) {
      const json = await res.json();
      setReminders(json.reminders ?? []);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const addReminder = async (hours: number) => {
    if (reminders.some((r) => r.hours_before === hours)) return;
    setAdding(true);
    setError(null);
    const res = await fetch(`/api/admin/events/${eventId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours_before: hours }),
    });
    if (res.ok) {
      const json = await res.json();
      setReminders((prev) => [...prev, json.reminder].sort((a, b) => a.hours_before - b.hours_before));
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "追加に失敗しました");
    }
    setAdding(false);
  };

  const removeReminder = async (reminder: Reminder) => {
    const res = await fetch(
      `/api/admin/events/${eventId}/reminders?reminderId=${reminder.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
    }
  };

  const handleCustomAdd = () => {
    const h = parseInt(custom, 10);
    if (!Number.isInteger(h) || h < 1 || h > 720) {
      setError("1〜720時間の整数を入力してください");
      return;
    }
    setCustom("");
    addReminder(h);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">リマインド通知</span>
      </div>
      <p className="text-xs text-muted-foreground">
        イベント開始の何時間前に参加者へ通知するか設定します（複数可）
      </p>

      {/* Current reminders */}
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {loading ? (
          <span className="text-xs text-muted-foreground">読み込み中…</span>
        ) : reminders.length === 0 ? (
          <span className="text-xs text-muted-foreground">未設定</span>
        ) : (
          reminders.map((r) => (
            <Badge key={r.id} variant="secondary" className="flex items-center gap-1 pr-1">
              {hoursLabel(r.hours_before)}
              <button
                onClick={() => removeReminder(r)}
                className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                aria-label="削除"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((h) => {
          const already = reminders.some((r) => r.hours_before === h);
          return (
            <Button
              key={h}
              type="button"
              size="sm"
              variant={already ? "secondary" : "outline"}
              disabled={already || adding}
              onClick={() => addReminder(h)}
              className="h-7 text-xs"
            >
              {hoursLabel(h)}
            </Button>
          );
        })}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={720}
          placeholder="任意の時間数"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCustomAdd(); }}}
          className="w-36 h-8 text-sm"
        />
        <span className="text-sm text-muted-foreground">時間前</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={adding || !custom}
          onClick={handleCustomAdd}
          className="h-8"
        >
          <Plus className="size-3.5 mr-1" />
          追加
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
