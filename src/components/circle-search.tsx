"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Circle = {
  id: string;
  name: string;
  description: string | null;
  events: { count: number }[];
};

export function CircleSearch({ circles }: { circles: Circle[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? circles.filter(
        (c) =>
          c.name.includes(query) ||
          (c.description ?? "").includes(query)
      )
    : circles;

  return (
    <div>
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="サークル名・説明で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {query.trim() ? `「${query}」に一致するサークルが見つかりませんでした。` : "現在登録されているサークルはありません。"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((circle) => (
            <Link key={circle.id} href={`/circles/${circle.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">{circle.name}</CardTitle>
                  {circle.description && (
                    <CardDescription className="line-clamp-2">
                      {circle.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    イベント {circle.events?.[0]?.count ?? 0} 件
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
