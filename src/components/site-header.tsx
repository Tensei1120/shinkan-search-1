import Link from "next/link";
import { CalendarDays, Search, BookMarked } from "lucide-react";

export function SiteHeader() {
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
            href="/my-reservations"
            className="flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <BookMarked className="size-4 shrink-0" />
            <span className="hidden sm:inline">マイ予約</span>
          </Link>
          <Link
            href="/calendar"
            className="flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <CalendarDays className="size-4 shrink-0" />
            <span className="hidden sm:inline">カレンダー</span>
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
