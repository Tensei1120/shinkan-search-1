"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ChevronRight, CalendarDays, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";

const CIRCLE_FAVORITES_KEY = "shinkan_favorite_circles";

type CircleRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  university: string | null;
  logo_url: string | null;
  event_count: number;
};

export function CircleListings({
  circles,
  universities,
}: {
  circles: CircleRow[];
  universities: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [university, setUniversity] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CIRCLE_FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(CIRCLE_FAVORITES_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const filtered = useMemo(() => {
    return circles.filter((c) => {
      if (query.trim()) {
        const q = query.trim();
        if (!c.name.includes(q) && !(c.description ?? "").includes(q)) return false;
      }
      if (category !== "all" && c.category !== category) return false;
      if (university !== "all" && c.university !== university) return false;
      if (favoritesOnly && !favorites.has(c.id)) return false;
      return true;
    });
  }, [circles, query, category, university, favoritesOnly, favorites]);

  const activeFilters = [category !== "all", university !== "all", favoritesOnly].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("all");
    setUniversity("all");
    setQuery("");
    setFavoritesOnly(false);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="団体名・キーワードで検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0 gap-1"
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">絞り込み</span>
          {activeFilters > 0 && (
            <span className="ml-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 mb-4 bg-muted/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">カテゴリ</p>
            <Select value={category} onValueChange={(v) => setCategory((v as string) ?? "all")}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {universities.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">大学</p>
              <Select value={university} onValueChange={(v) => setUniversity((v as string) ?? "all")}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              お気に入りのみ表示
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{filtered.length} 団体</p>
        {(activeFilters > 0 || query.trim()) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" /> フィルターをリセット
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🏫</p>
          <p>条件に一致する団体が見つかりませんでした。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((circle) => {
            const catColor = CATEGORY_COLORS[circle.category] ?? CATEGORY_COLORS.other;
            const catLabel = CATEGORIES[circle.category as keyof typeof CATEGORIES] ?? circle.category;
            const isFav = favorites.has(circle.id);
            return (
              <Link
                key={circle.id}
                href={`/circles/${circle.id}`}
                className="border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-background"
              >
                <div className="flex items-start gap-3">
                  {circle.logo_url ? (
                    <img
                      src={circle.logo_url}
                      alt={circle.name}
                      className="size-12 rounded-lg object-cover shrink-0 border"
                    />
                  ) : (
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg font-bold text-primary">
                      {circle.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
                      {catLabel}
                    </span>
                    <p className="font-semibold leading-snug mt-1 truncate">{circle.name}</p>
                    {circle.university && (
                      <p className="text-xs text-muted-foreground">{circle.university}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(e, circle.id)}
                    className="shrink-0 text-muted-foreground hover:text-rose-500 transition-colors"
                    aria-label={isFav ? "お気に入り解除" : "お気に入り追加"}
                  >
                    <Heart className={`size-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                </div>

                {circle.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{circle.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-1 border-t">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    イベント {circle.event_count} 件
                  </span>
                  <span className="flex items-center gap-0.5 text-sm font-medium text-primary">
                    詳細を見る <ChevronRight className="size-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
