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
    if (res.ok) {
      setMsgResult("sent");
      setMessageBody("");
    } else {
      setMsgResult("error");
    }
  };

  const handleClose = (open: boolean) => {
    setMessageOpen(open);
    if (!open) { setMsgResult(null); setMessageBody(""); }
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {currentStatus === "pending" && (
        <Button size="sm" variant="default" disabled={loading} onClick={() => updateStatus("approved")}>
          承認
        </Button>
      )}
      {(currentStatus === "pending" || currentStatus === "approved") && (
        <Button size="sm" variant="destructive" disabled={loading} onClick={() => updateStatus("rejected")}>
          却下
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
        メール送信
      </Button>

      <Dialog open={messageOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reserveeName} さんへのメッセージ</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">送信先: {reserveeEmail}</p>

          {msgResult === "sent" ? (
            <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
              <CheckCircle className="size-5" />
              <span className="font-medium">送信しました</span>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {msgResult === "error" && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <XCircle className="size-4" />送信に失敗しました。再度お試しください。
                </div>
              )}
              <Label>メッセージ本文</Label>
              <Textarea
                rows={5}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="リマインダーや追加情報をご記入ください"
              />
              <Button
                onClick={sendMessage}
                disabled={msgLoading || !messageBody.trim()}
                className="w-full"
              >
                {msgLoading ? "送信中..." : "送信する"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
