import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ReservationInfo {
  name: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string | null;
  circleName: string;
  circleEmail: string;
}

export function reservationConfirmHtml(info: ReservationInfo) {
  const dateStr = format(new Date(info.eventDate), "M月d日(E) HH:mm", { locale: ja });
  return `
<p>${info.name} 様</p>
<p>以下のイベントへのご予約を受け付けました。</p>
<table>
  <tr><td><strong>サークル</strong></td><td>${info.circleName}</td></tr>
  <tr><td><strong>イベント</strong></td><td>${info.eventTitle}</td></tr>
  <tr><td><strong>日時</strong></td><td>${dateStr}</td></tr>
  ${info.eventLocation ? `<tr><td><strong>場所</strong></td><td>${info.eventLocation}</td></tr>` : ""}
</table>
<p>ご不明な点は <a href="mailto:${info.circleEmail}">${info.circleEmail}</a> までお問い合わせください。</p>
`;
}

export function reservationNotifyHtml(info: ReservationInfo & { grade: string; department: string; note: string | null }) {
  const dateStr = format(new Date(info.eventDate), "M月d日(E) HH:mm", { locale: ja });
  return `
<p>新しい予約が入りました。</p>
<table>
  <tr><td><strong>イベント</strong></td><td>${info.eventTitle} (${dateStr})</td></tr>
  <tr><td><strong>氏名</strong></td><td>${info.name}</td></tr>
  <tr><td><strong>メール</strong></td><td>${info.email}</td></tr>
  <tr><td><strong>学年</strong></td><td>${info.grade}</td></tr>
  <tr><td><strong>学部</strong></td><td>${info.department}</td></tr>
  ${info.note ? `<tr><td><strong>備考</strong></td><td>${info.note}</td></tr>` : ""}
</table>
<p>管理画面から予約の確認・承認ができます。</p>
`;
}

export function reservationStatusHtml(info: { name: string; eventTitle: string; status: "approved" | "rejected" }) {
  const statusText = info.status === "approved" ? "承認されました" : "お断りとなりました";
  return `
<p>${info.name} 様</p>
<p>「${info.eventTitle}」へのご予約が<strong>${statusText}</strong>。</p>
${info.status === "rejected" ? "<p>またの機会にぜひご参加ください。</p>" : ""}
`;
}
