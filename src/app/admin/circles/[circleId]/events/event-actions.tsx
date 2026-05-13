"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell } from "lucide-react";
import ReminderManager from "@/components/admin/reminder-manager";

export default function EventActions({
  eventId,
  circleId,
}: {
  eventId: string;
  circleId: string;
}) {
  const router = useRouter();
  const [reminderOpen, setReminderOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm("このイベントを削除しますか？関連する予約もすべて削除されます。")) return;

    const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("削除に失敗しました");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setReminderOpen(true)}
        title="リマインド通知設定"
      >
        <Bell className="size-3.5" />
      </Button>

      <Link
        href={`/admin/circles/${circleId}/events/${eventId}/edit`}
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        編集
      </Link>
      <Button size="sm" variant="ghost" onClick={handleDelete}>
        削除
      </Button>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>リマインド通知設定</DialogTitle>
          </DialogHeader>
          <ReminderManager eventId={eventId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}