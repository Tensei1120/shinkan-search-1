"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, MapPin, Calendar, Users, ChevronRight, SlidersHorizontal, X,
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
  circles: {
    id: string;
    name: string;
    category: string;
    university: string | null;
  };
};

function matchesDate(dateStr: string, year: string, month: string, day: string): boolean {
  const d = new Date(dateStr);
  if (year && format(d, "yyyy") !== year) return false;
  if (month && format(d, "M") !== month) return false;
  if (day && format(d, "d") !== day) return false;
  return true;
}

export function EventListings({ events, universities }: { events: EventRow[]; universities: string[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [university, setUniversity] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const hasDateFilter = filterMonth !== "" || filterDay !== "";

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (query.trim()) {
        const q = query.trim();
        if (!ev.title.includes(q) && !ev.circles.name.includes(q) && !(ev.description ?? "").includes(q)) return false;
      }
      if (category !== "all" && ev.circles.category !== category) return false;
      if (!matchesDate(ev.date, filterYear, filterMonth, filterDay)) return false;
      if (university !== "all" && ev.circles.university !== university) return false;
      return true;
    });
  }, [events, query, category, filterYear, filterMonth, filterDay, university]);

  const activeFilters = [category !== "all", hasDateFilter, university !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("all");
    setFilterYear(String(new Date().getFullYear()));
    setFilterMonth("");
    setFilterDay("");
    setUniversity("all");
    setQuery("");
  };

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
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="h-8 text-sm w-[4.5rem] px-2"
                min={2020}
                max={2099}
              />
              <span className="text-sm shrink-0">年</span>
              <Input
                type="number"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                placeholder="月"
                className="h-8 text-sm w-10 px-2"
                min={1}
                max={12}
              />
              <span className="text-sm shrink-0">月</span>
              <Input
                type="number"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                placeholder="日"
                className="h-8 text-sm w-10 px-2"
                min={1}
                max={31}
              />
              <span className="text-sm shrink-0">日</span>
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
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length} 件のイベント
        </p>
        {(activeFilters > 0 || query.trim()) && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="size-3" /> フィルターをリセット
          </button>
        )}
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

            return (
              <div key={ev.id} className="border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-background">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
                    {CATEGORIES[ev.circles.category as keyof typeof CATEGORIES] ?? ev.circles.category}
                  </span>
                  {ev.circles.university && (
                    <span className="text-xs text-muted-foreground">{ev.circles.university}</span>
                  )}
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
