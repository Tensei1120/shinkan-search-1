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

const schema = z.object({
  name: z.string().min(1, "サークル名を入力してください"),
  description: z.string().optional(),
  university: z.string().optional(),
  category: z.string().min(1),
  contact_email: z.string().email("正しいメールアドレスを入力してください"),
  logo_url: z.string().url("正しいURLを入力してください").optional().or(z.literal("")),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="name">サークル名 *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">紹介文</Label>
        <Textarea id="description" rows={4} placeholder="サークルの活動内容を紹介してください" {...register("description")} />
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
        <Label htmlFor="university">大学名</Label>
        <Input id="university" placeholder="〇〇大学" {...register("university")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="contact_email">連絡先メールアドレス *</Label>
        <Input id="contact_email" type="email" {...register("contact_email")} />
        {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="logo_url">ロゴ画像URL</Label>
        <Input id="logo_url" type="url" placeholder="https://..." {...register("logo_url")} />
        {errors.logo_url && <p className="text-sm text-destructive">{errors.logo_url.message}</p>}
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
