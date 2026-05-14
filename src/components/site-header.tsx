import Link from "next/link";
import { Search, User, Building2 } from "lucide-react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("student_profile")?.value;
  const profile = raw ? (JSON.parse(raw) as { name: string; email?: string }) : null;

  let unreadCount = 0;
  if (profile?.email) {
    try {
      const supabase = await createClient();
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id")
        .eq("email", profile.email);
      const ids = (reservations ?? []).map((r) => r.id);
      if (ids.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: unread } = await (supabase as any)
          .from("messages")
          .select("id")
          .in("reservation_id", ids)
          .eq("sender_type", "admin")
          .is("read_at", null);
        unreadCount = unread?.length ?? 0;
      }
    } catch { /* messages table may not exist yet */ }
  }

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-base sm:text-lg tracking-tight">
          らくらく！新歓
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4 text-sm">
          <Link
            href="/"
            className="flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Search className="size-4 shrink-0" />
            <span className="hidden sm:inline">イベントを探す</span>
          </Link>
          <Link
            href="/circles"
            className="flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Building2 className="size-4 shrink-0" />
            <span className="hidden sm:inline">団体一覧</span>
          </Link>
          <Link
            href="/my"
            className="relative flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <User className="size-4 shrink-0" />
            <span className="hidden sm:inline">
              {profile ? profile.name : "マイページ"}
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            )}
          </Link>
          <Link
            href="/admin"
            className="ml-2 text-xs text-muted-foreground hover:underline hidden sm:block"
          >
            管理者
          </Link>
        </nav>
      </div>
    </header>
  );
}
