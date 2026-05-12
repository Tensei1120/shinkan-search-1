"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  name: z.string().min(1, "お名前を入力してください"),
  university: z.string().optional(),
  department: z.string().optional(),
  grade: z.string().optional(),
  gender: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const GRADES = ["1年生", "2年生", "3年生", "4年生", "大学院±1年", "大学院±2年", "その他"];
const GENDERS = ["男性", "女性", "その他", "回答しない"];

interface Props {
  defaultValues?: Partial<FormData>;
  isEdit?: boolean;
}

export function RegisterForm({ defaultValues, isEdit }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await fetch("/api/student/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "登録に失敗しました");
      return;
    }
    router.push("/my");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="email">メールアドレス *</Label>
        <Input id="email" type="email" placeholder="your@email.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">お名前 *</Label>
        <Input id="name" placeholder="山田 太郎" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="university">所属大学</Label>
        <Input id="university" placeholder="〇〇大学" {...register("university")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="department">学部・学科</Label>
        <Input id="department" placeholder="〇〇学部" {...register("department")} />
      </div>

      <div className="space-y-1">
        <Label>学年</Label>
        <Select
          defaultValue={defaultValues?.grade ?? ""}
          onValueChange={(v) => setValue("grade", (v as string) || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>性別</Label>
        <Select
          defaultValue={defaultValues?.gender ?? ""}
          onValueChange={(v) => setValue("gender", (v as string) || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            {GENDERS.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "保存中..." : isEdit ? "更新する" : "登録してマイページへ"}
      </Button>
    </form>
  );
}
