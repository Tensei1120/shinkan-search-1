"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Mail } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  grade: z.string().min(1, "学年を選択してください"),
  department: z.string().min(1, "学部を入力してください"),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const GRADES = ["1年生", "2年生", "3年生", "4年生", "修士1年", "修士2年", "博士"];

type Profile = { name: string; email: string; furigana?: string; grade?: string; department?: string };

export default function ReservationForm({
  eventId,
  eventTitle,
  profile,
  circleName,
  circleEmail,
}: {
  eventId: string;
  eventTitle: string;
  profile: Profile | null;
  circleName: string;
  circleEmail: string;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: profile
        ? {
            name: profile.name,
            email: profile.email,
            grade: profile.grade ?? "",
            department: profile.department ?? "",
          }
        : undefined,
    });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, eventId }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "予約に失敗しました。もう一度お試しください。");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="rounded-xl border p-6 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-2xl">🎉</p>
          <p className="text-lg font-semibold">予約が完了しました！</p>
          <p className="text-sm text-muted-foreground">
            確認メールをお送りしました。承認をお待ちください。
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <p className="text-sm font-medium">主催サークルへの連絡</p>
          <p className="text-xs text-muted-foreground">
            質問や変更がある場合は、{circleName} に直接ご連絡ください。
          </p>
          <a
            href={`mailto:${circleEmail}?subject=${encodeURIComponent(`【${eventTitle}】について`)}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Mail className="size-4" />{circleEmail}
          </a>
        </div>
        <Link href="/my" className="block text-center text-sm text-muted-foreground hover:underline">
          マイページで予約状況を確認する →
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border p-6 text-center space-y-3">
        <p className="font-semibold">予約にはプロフィール登録が必要です</p>
        <p className="text-sm text-muted-foreground">
          お名前・メールアドレス等を事前に登録しておくと、毎回入力せずに予約できます。
        </p>
        <Link
          href={`/register?next=/circles/${encodeURIComponent(eventId)}`}
          className="inline-block"
        >
          <Button>プロフィールを登録する</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-lg font-semibold">「{eventTitle}」に予約する</h2>

      <div className="rounded-lg bg-muted/40 border px-4 py-3 text-sm text-muted-foreground">
        プロフィール情報を自動入力しました。変更が必要な場合は
        <Link href="/register?edit=1" className="underline ml-1">こちらから編集</Link>できます。
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">氏名 *</Label>
        <Input id="name" placeholder="山田 太郎" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">メールアドレス *</Label>
        <Input id="email" type="email" placeholder="taro@example.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="grade">学年 *</Label>
        <Select
          defaultValue={profile.grade ?? ""}
          onValueChange={(v) => setValue("grade", v as string)}
        >
          <SelectTrigger id="grade">
            <SelectValue placeholder="学年を選択" />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="department">学部・学科 *</Label>
        <Input id="department" placeholder="工学部 情報工学科" {...register("department")} />
        {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="note">備考（アレルギー等）</Label>
        <Textarea id="note" placeholder="何かあればご記入ください" rows={3} {...register("note")} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "予約する"}
      </Button>
    </form>
  );
}
