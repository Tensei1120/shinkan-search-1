"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search, MapPin, Calendar, Users, ChevronRight, SlidersHorizontal, X, Heart,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  capacity: number;
  reserved_count: number;
  status: "open" | "closed" | "cancelled";
  tags: string | null | undefined;
  circles: {
    id: string;
    name: string;
    category: string;
    university: string | null;
    genre: string | null;
  };
};

type SortKey = "date-asc" | "date-desc" | "seats-asc" | "seats-desc";

function matchesDate(dateStr: string, selectedDate: string): boolean {
  if (!selectedDate) return true;
  return format(new Date(dateStr), "yyyy-MM-dd") === selectedDate;
}

const FAVORITES_KEY = "shinkan_favorite_events";

export function EventListings({
  events,
  universities,
  allTags = [],
}: {
  events: EventRow[];
  universities: string[];
  allTags?: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [university, setUniversity] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date-asc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const baseFiltered = useMemo(() => {
    return events.filter((ev) => {
      if (query.trim()) {
        const q = query.trim();
        const inTags = (ev.tags ?? "").includes(q) || (ev.circles.genre ?? "").includes(q);
        if (!ev.title.includes(q) && !ev.circles.name.includes(q) && !(ev.description ?? "").includes(q) && !inTags) return false;
      }
      if (category !== "all" && ev.circles.category !== category) return false;
      if (!matchesDate(ev.date, dateFilter)) return false;
      if (university !== "all" && ev.circles.university !== university) return false;
      if (openOnly) {
        const isFull = ev.reserved_count >= ev.capacity;
        if (ev.status !== "open" || isFull) return false;
      }
      if (favoritesOnly && !favorites.has(ev.id)) return false;
      return true;
    });
  }, [events, query, category, dateFilter, university, openOnly, favoritesOnly, favorites]);

  const visibleTags = useMemo(() => {
    const all = [...new Set(
      baseFiltered.flatMap((ev) => [
        ...(ev.circles.genre ? ev.circles.genre.split(",").map((t) => t.trim()).filter(Boolean) : []),
        ...(ev.tags ? ev.tags.split(",").map((t) => t.trim()).filter(Boolean) : []),
      ])
    )].sort();
    if (!query.trim()) return all;
    return all.filter((tag) => tag.includes(query.trim()));
  }, [baseFiltered, query]);

  const filtered = useMemo(() => {
    const base = !selectedTag ? baseFiltered : baseFiltered.filter((ev) => {
      const circleTags = ev.circles.genre ? ev.circles.genre.split(",").map((t) => t.trim()) : [];
      const eventTags = ev.tags ? ev.tags.split(",").map((t) => t.trim()) : [];
      return [...circleTags, ...eventTags].includes(selectedTag);
    });

    return [...base].sort((a, b) => {
      switch (sortKey) {
        case "date-asc":  return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "seats-desc": return (b.capacity - b.reserved_count) - (a.capacity - a.reserved_count);
        case "seats-asc":  return (a.capacity - a.reserved_count) - (b.capacity - b.reserved_count);
      }
    });
  }, [baseFiltered, selectedTag, sortKey]);

  const activeFilters = [category !== "all", dateFilter !== "", university !== "all", openOnly, favoritesOnly].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("all");
    setDateFilter("");
    setUniversity("all");
    setQuery("");
    setOpenOnly(false);
    setFavoritesOnly(false);
    setSelectedTag("");
  };

  useEffect(() => {
    if (selectedTag && !visibleTags.includes(selectedTag)) {
      setSelectedTag("");
    }
  }, [visibleTags, selectedTag]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="イベント名・サークル名で検索..."
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

      {visibleTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
              className={[
                "shrink-0 text-xs px-3 py-1 rounded-full border transition-colors",
                selectedTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="border rounded-lg p-4 mb-4 bg-muted/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <div>
            <p className="text-xs text-muted-foreground mb-1">日程</p>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-8 text-sm flex-1"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="日程をクリア"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
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
          <div className="sm:col-span-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              受付中のイベントのみ表示
            </label>
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
        <p className="text-sm text-muted-foreground">
          {filtered.length} 件のイベント
        </p>
        <div className="flex items-center gap-3">
          {(activeFilters > 0 || query.trim() || selectedTag) && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <X className="size-3" /> リセット
            </button>
          )}
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">日付が近い順</SelectItem>
              <SelectItem value="date-desc">日付が遠い順</SelectItem>
              <SelectItem value="seats-desc">残席が多い順</SelectItem>
              <SelectItem value="seats-asc">残席が少ない順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🔍</p>
          <p>条件に一致するイベントが見つかりませんでした。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev) => {
            const isFull = ev.reserved_count >= ev.capacity;
            const isClosed = ev.status === "closed";
            const unavailable = isFull || isClosed;
            const catColor = CATEGORY_COLORS[ev.circles.category] ?? CATEGORY_COLORS.other;
            const remaining = ev.capacity - ev.reserved_count;
            const isFav = favorites.has(ev.id);

            return (
              <div key={ev.id} className="border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-background">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
                      {CATEGORIES[ev.circles.category as keyof typeof CATEGORIES] ?? ev.circles.category}
                    </span>
                    {ev.circles.university && (
                      <span className="text-xs text-muted-foreground">{ev.circles.university}</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(ev.id)}
                    className="shrink-0 text-muted-foreground hover:text-rose-500 transition-colors"
                    aria-label={isFav ? "お気に入り解除" : "お気に入り追加"}
                  >
                    <Heart className={`size-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">{ev.circles.name}</p>
                  <h3 className="font-semibold leading-snug mt-0.5">{ev.title}</h3>
                </div>

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 shrink-0" />
                    {format(new Date(ev.date), "M月d日(E) HH:mm", { locale: ja })}
                  </span>
                  {ev.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {ev.location}
                    </span>
                  )}
                </div>

                {ev.tags && (
                  <div className="flex flex-wrap gap-1">
                    {ev.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between">
                  {unavailable ? (
                    <Badge variant="secondary" className="text-xs">受付終了</Badge>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      残り <strong className="text-foreground">{remaining}</strong> 席
                    </span>
                  )}
                  <Link
                    href={`/circles/${ev.circles.id}/events/${ev.id}`}
                    className={[
                      "flex items-center gap-0.5 text-sm font-medium",
                      unavailable
                        ? "text-muted-foreground pointer-events-none"
                        : "text-primary hover:underline",
                    ].join(" ")}
                  >
                    {unavailable ? "満員" : "予約する"}
                    {!unavailable && <ChevronRight className="size-4" />}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
