"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminRegisterPage() {
  const supabase = createClient();

  const [form, setForm] = useState({
    circleName: "",
    adminName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    university: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (form.password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        circleName: form.circleName,
        adminName: form.adminName,
        email: form.email,
        password: form.password,
        university: form.university || undefined,
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "登録に失敗しました");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);
    if (signInError) {
      window.location.href = "/admin/login";
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>管理者アカウント登録</CardTitle>
          <CardDescription>
            新しい団体・サークルの管理者アカウントを作成します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="circleName">団体名 *</Label>
              <Input
                id="circleName"
                placeholder="〇〇サークル"
                value={form.circleName}
                onChange={set("circleName")}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="university">大学名</Label>
              <Input
                id="university"
                placeholder="〇〇大学"
                value={form.university}
                onChange={set("university")}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="adminName">管理者名 *</Label>
              <Input
                id="adminName"
                placeholder="山田 太郎"
                value={form.adminName}
                onChange={set("adminName")}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={set("email")}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">パスワード * <span className="text-xs text-muted-foreground">（8文字以上）</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="passwordConfirm">パスワード（確認） *</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={form.passwordConfirm}
                onChange={set("passwordConfirm")}
                required
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登録中..." : "アカウントを作成する"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              すでにアカウントをお持ちの方は{" "}
              <Link href="/admin/login" className="underline hover:text-foreground">
                ログイン
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
