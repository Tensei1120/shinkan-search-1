"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Message {
  id: string;
  sender_type: "admin" | "student";
  body: string;
  created_at: string;
  read_at: string | null;
}

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
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

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

  const loadMessages = useCallback(async () => {
    setMsgLoading(true);
    const res = await fetch(`/api/messages?reservationId=${reservationId}`);
    if (res.ok) {
      const json = await res.json();
      setMessages(json.messages ?? []);
    }
    setMsgLoading(false);
  }, [reservationId]);

  const openChat = () => {
    setMsgOpen(true);
    loadMessages();
  };

  const sendMessage = async () => {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId, body: body.trim(), senderType: "admin" }),
    });
    if (res.ok) {
      const json = await res.json();
      setMessages((prev) => [...prev, json.message]);
      setBody("");
    }
    setSending(false);
  };

  return (
    <div className="flex gap-1 flex-wrap">
      {currentStatus !== "approved" && currentStatus !== "cancelled" && (
        <Button size="sm" variant="default" disabled={loading} onClick={() => updateStatus("approved")}>
          承認
        </Button>
      )}
      {currentStatus !== "rejected" && currentStatus !== "cancelled" && (
        <Button size="sm" variant="destructive" disabled={loading} onClick={() => updateStatus("rejected")}>
          却下
        </Button>
      )}

      <Button size="sm" variant="outline" onClick={openChat}>
        <MessageCircle className="size-3.5 mr-1" />
        メッセージ
      </Button>

      <Dialog open={msgOpen} onOpenChange={(open) => { setMsgOpen(open); if (!open) setBody(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{reserveeName} さんとのメッセージ</DialogTitle>
          </DialogHeader>

          {/* Message thread */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto py-2 px-1">
            {msgLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">読み込み中…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">メッセージはまだありません</p>
            ) : (
              messages.map((m) => {
                const isAdmin = m.sender_type === "admin";
                return (
                  <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                        isAdmin
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {m.body}
                      <div className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {format(new Date(m.created_at), "M/d HH:mm", { locale: ja })}
                        {isAdmin && m.read_at && " · 既読"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply box */}
          <div className="flex gap-2 mt-2">
            <Textarea
              rows={2}
              className="resize-none"
              placeholder="メッセージを入力…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage();
              }}
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
    </div>
  );
}
