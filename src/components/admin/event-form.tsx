"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  date: z.string().min(1, "日時を入力してください"),
  location: z.string().optional(),
  capacity: z.number().int().min(1, "定員は1以上にしてください"),
  status: z.enum(["open", "closed", "cancelled"]),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  circleId: string;
  defaultValues?: Partial<FormData>;
  eventId?: string;
}

export default function EventForm({ circleId, defaultValues, eventId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "open", capacity: 20, ...defaultValues },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const url = eventId ? `/api/admin/events/${eventId}` : "/api/admin/events";
    const method = eventId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, circleId }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "保存に失敗しました");
      return;
    }

    router.push(`/admin/circles/${circleId}/events`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="title">タイトル *</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">説明</Label>
        <Textarea id="description" rows={4} {...register("description")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="date">開催日時 *</Label>
        <Input id="date" type="datetime-local" {...register("date")} />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="location">場所</Label>
        <Input id="location" placeholder="〇〇キャンパス 第1会議室" {...register("location")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="capacity">定員 *</Label>
        <Input id="capacity" type="number" min={1} {...register("capacity", { valueAsNumber: true })} />
        {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>ステータス</Label>
        <Select
          defaultValue={defaultValues?.status ?? "open"}
          onValueChange={(v) => setValue("status", (v as string) as FormData["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">受付中</SelectItem>
            <SelectItem value="closed">受付終了</SelectItem>
            <SelectItem value="cancelled">中止</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="tags">タグ</Label>
        <Input id="tags" placeholder="例: 初心者歓迎, 体験入部, 無料（カンマ区切り）" {...register("tags")} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/circles/${circleId}/events`)}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
