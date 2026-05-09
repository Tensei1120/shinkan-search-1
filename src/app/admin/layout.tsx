import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page renders without the header
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/admin" className="font-semibold text-lg">
          管理者ダッシュボード
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
