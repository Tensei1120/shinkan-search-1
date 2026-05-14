"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  unreadCount?: number;
}

export default function ReservationActions({
  reservationId,
  currentStatus,
  reserveeName,
  unreadCount = 0,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (msgOpen) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [msgOpen]);

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
      setLocalUnread(0);
    }
    setMsgLoading(false);
  }, [reservationId]);

  const openChat = () => { setMsgOpen(true); loadMessages(); };

  const sendMessage = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId, body: text, senderType: "admin" }),
    });
    if (res.ok) {
      const json = await res.json();
      setMessages((prev) => [...prev, json.message]);
      setBody("");
      textareaRef.current?.focus();
    }
    setSending(false);
  };

  return (
    <div className="flex gap-1 flex-wrap items-center">
      {currentStatus !== "approved" && currentStatus !== "cancelled" && (
        <Button size="sm" variant="default" disabled={loading} onClick={() => updateStatus("approved")}>承認</Button>
      )}
      {currentStatus !== "rejected" && currentStatus !== "cancelled" && (
        <Button size="sm" variant="destructive" disabled={loading} onClick={() => updateStatus("rejected")}>却下</Button>
      )}
      <div className="relative">
        <Button
          size="sm"
          variant={localUnread > 0 ? "default" : "outline"}
          onClick={openChat}
          className={localUnread > 0 ? "pr-2" : ""}
        >
          <MessageCircle className="size-3.5 mr-1" />
          メッセージ
          {localUnread > 0 && (
            <span className="ml-1.5 bg-white text-primary text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {localUnread}
            </span>
          )}
        </Button>
      </div>
      <Dialog open={msgOpen} onOpenChange={(open) => { setMsgOpen(open); if (!open) setBody(""); }}>
        <DialogContent className="max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="text-base">{reserveeName} さんとのメッセージ</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 flex-1 min-h-0 max-h-80 overflow-y-auto px-4 py-3">
            {msgLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">読み込み中…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">メッセージはまだありません</p>
            ) : (
              messages.map((m) => {
                const isAdmin = m.sender_type === "admin";
                return (
                  <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      isAdmin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                    }`}>
                      {m.body}
                      <div className={`text-[10px] mt-0.5 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {format(new Date(m.created_at), "M/d HH:mm", { locale: ja })}
                        {isAdmin && m.read_at && " · 既読"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t px-4 py-3 flex gap-2 items-end bg-background">
            <Textarea
              ref={textareaRef}
              rows={2}
              className="resize-none flex-1 text-sm"
              placeholder="メッセージを入力… (Enter で送信)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <Button size="icon" onClick={sendMessage} disabled={sending || !body.trim()} className="shrink-0">
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-right px-4 pb-2">Shift + Enter で改行</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
