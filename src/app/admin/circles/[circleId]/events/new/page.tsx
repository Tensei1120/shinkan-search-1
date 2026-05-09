import Link from "next/link";
import EventForm from "@/components/admin/event-form";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const { circleId } = await params;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href={`/admin/circles/${circleId}/events`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← イベント一覧に戻る
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">新規イベント作成</h1>
      <EventForm circleId={circleId} />
    </div>
  );
}
