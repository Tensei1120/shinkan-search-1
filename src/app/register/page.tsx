import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const cookieStore = await cookies();
  const raw = cookieStore.get("student_profile")?.value;

  if (raw && !edit) redirect("/my");

  const profile = raw ? JSON.parse(raw) : undefined;
  const isEdit = Boolean(edit);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-md mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">{isEdit ? "✏️" : "👋"}</div>
          <h1 className="text-2xl font-bold">
            {isEdit ? "プロフィール編集" : "はじめまして！"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isEdit
              ? "プロフィール情報を更新できます。"
              : "プロフィールを登録して、新歓イベントを予約しましょう。"}
          </p>
        </div>
        <RegisterForm defaultValues={profile} isEdit={isEdit} />
      </main>
    </div>
  );
}
