"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";

export default function EventActions({
  eventId,
  circleId,
}: {
  eventId: string;
  circleId: string;
}) {
  const router = useRouter();

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
      <Link href={`/admin/circles/${circleId}/events/${eventId}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
        編集
      </Link>
      <Button size="sm" variant="ghost" onClick={handleDelete}>
        削除
      </Button>
    </div>
  );
}
