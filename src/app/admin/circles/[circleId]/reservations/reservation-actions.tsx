"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  reservationId: string;
  currentStatus: "pending" | "approved" | "rejected" | "cancelled";
  reserveeName: string;
  reserveeEmail: string;
  eventTitle: string;
}

export default function ReservationActions({
  reservationId,
  currentStatus,
  reserveeName,
  reserveeEmail,
  eventTitle,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgResult, setMsgResult] = useState<"sent" | "error" | null>(null);

  const updateStatus = async (status: "approved" | "rejected") => {
    setLoading(true);
    await fetch(`/api/admin/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  };

  const sendMessage = async () => {
    if (!messageBody.trim()) return;
    setMsgLoading(true);
    setMsgResult(null);
    const res = await fetch("/api/admin/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: reserveeEmail, name: reserveeName, body: messageBody, eventTitle }),
    });
    setMsgLoading(false);
    setMsgResult(res.ok ? "sent" : "error");
    if (res.ok) {
      setMessageBody("");
    }
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {currentStatus !== "approved" && currentStatus !== "cancelled" && (
        <Button
          size="sm"
          variant="default"
          disabled={loading}
          onClick={() => updateStatus("approved")}
        >
          承認
        </Button>
      )}
      {currentStatus !== "rejected" && currentStatus !== "cancelled" && (
        <Button
          size="sm"
          variant="destructive"
          disabled={loading}
          onClick={() => updateStatus("rejected")}
        >
          却下
        </Button>
      )}

      <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
        メール送信
      </Button>

      <Dialog open={messageOpen} onOpenChange={(open) => { setMessageOpen(open); if (!open) setMsgResult(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reserveeName} さんへのメッセージ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {msgResult === "sent" ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                <CheckCircle className="size-4 shrink-0" />
                <p className="text-sm">メールを送信しました</p>
              </div>
            ) : msgResult === "error" ? (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3">
                <XCircle className="size-4 shrink-0" />
                <p className="text-sm">送信に失敗しました。もう一度お試しください。</p>
              </div>
            ) : null}
            <Label>メッセージ本文</Label>
            <Textarea
              rows={5}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="リマインダーや追加情報をご記入ください"
            />
            <Button onClick={sendMessage} disabled={msgLoading || !messageBody.trim()} className="w-full">
              {msgLoading ? "送信中..." : "送信する"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
