"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";

const urlOpt = z.string().url("正しいURLを入力してください").optional().or(z.literal(""));

const schema = z.object({
  name: z.string().min(1, "サークル名を入力してください"),
  description: z.string().optional(),
  university: z.string().optional(),
  category: z.string().min(1),
  contact_email: z.string().email("正しいメールアドレスを入力してください"),
  logo_url: urlOpt,
  member_count: z.string().optional(),
  admission_fee: z.string().optional(),
  annual_fee: z.string().optional(),
  activity_frequency: z.string().optional(),
  gender_ratio: z.string().optional(),
  genre: z.string().optional(),
  twitter_url: urlOpt,
  instagram_url: urlOpt,
  youtube_url: urlOpt,
  line_url: urlOpt,
  website_url: urlOpt,
});

type FormData = z.infer<typeof schema>;

interface Props {
  circleId: string;
  defaultValues: Partial<FormData>;
}

export default function CircleForm({ circleId, defaultValues }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "other", ...defaultValues },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await fetch(`/api/admin/circles/${circleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "保存に失敗しました");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-lg">

      {/* 基本情報 */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">基本情報</h2>

        <div className="space-y-1">
          <Label htmlFor="name">団体名 *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">紹介文</Label>
          <Textarea id="description" rows={4} placeholder="活動内容を紹介してください" {...register("description")} />
        </div>

        <div className="space-y-1">
          <Label>カテゴリ</Label>
          <Select defaultValue={defaultValues.category ?? "other"} onValueChange={(v) => setValue("category", (v as string) ?? "other")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="university">キャンパス・大学名</Label>
          <Input id="university" placeholder="〇〇大学" {...register("university")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="contact_email">連絡先メールアドレス *</Label>
          <Input id="contact_email" type="email" {...register("contact_email")} />
          {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="logo_url">アイコン画像URL</Label>
          <Input id="logo_url" type="url" placeholder="https://..." {...register("logo_url")} />
          {errors.logo_url && <p className="text-sm text-destructive">{errors.logo_url.message}</p>}
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">詳細情報</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="member_count">部員数（人）</Label>
            <Input id="member_count" type="number" min={0} placeholder="例: 50" {...register("member_count")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="activity_frequency">活動頻度</Label>
            <Input id="activity_frequency" placeholder="例: 週3回" {...register("activity_frequency")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="admission_fee">入会金（円）</Label>
            <Input id="admission_fee" type="number" min={0} placeholder="例: 5000" {...register("admission_fee")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="annual_fee">年会費（円）</Label>
            <Input id="annual_fee" type="number" min={0} placeholder="例: 12000" {...register("annual_fee")} />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="gender_ratio">男女比</Label>
          <Input id="gender_ratio" placeholder="例: 男60% 女40%" {...register("gender_ratio")} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="genre">ジャンル・タグ</Label>
          <Input id="genre" placeholder="例: バンド, ロック, 音楽（カンマ区切り）" {...register("genre")} />
        </div>
      </div>

      {/* SNSリンク */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">SNS・リンク</h2>

        <div className="space-y-1">
          <Label htmlFor="twitter_url">Twitter / X</Label>
          <Input id="twitter_url" type="url" placeholder="https://twitter.com/..." {...register("twitter_url")} />
          {errors.twitter_url && <p className="text-sm text-destructive">{errors.twitter_url.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="instagram_url">Instagram</Label>
          <Input id="instagram_url" type="url" placeholder="https://instagram.com/..." {...register("instagram_url")} />
          {errors.instagram_url && <p className="text-sm text-destructive">{errors.instagram_url.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="youtube_url">YouTube</Label>
          <Input id="youtube_url" type="url" placeholder="https://youtube.com/..." {...register("youtube_url")} />
          {errors.youtube_url && <p className="text-sm text-destructive">{errors.youtube_url.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="line_url">LINE（オープンチャット等）</Label>
          <Input id="line_url" type="url" placeholder="https://line.me/..." {...register("line_url")} />
          {errors.line_url && <p className="text-sm text-destructive">{errors.line_url.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="website_url">Webサイト</Label>
          <Input id="website_url" type="url" placeholder="https://..." {...register("website_url")} />
          {errors.website_url && <p className="text-sm text-destructive">{errors.website_url.message}</p>}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
