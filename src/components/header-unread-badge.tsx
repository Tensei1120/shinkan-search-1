"use client";

import { useEffect, useState } from "react";

const LAST_READ_KEY = "my_last_read";

export function HeaderUnreadBadge({ unreadItems }: { unreadItems: { id: string; latestAt: string }[] }) {
  const [count, setCount] = useState(unreadItems.length);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_READ_KEY);
      const lastReadMap: Record<string, string> = stored ? JSON.parse(stored) : {};
      const remaining = unreadItems.filter(
        ({ id, latestAt }) => !lastReadMap[id] || latestAt > lastReadMap[id]
      ).length;
      setCount(remaining);
    } catch {}
  }, [unreadItems]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center">
      <span className="animate-ping absolute inline-flex size-full rounded-full bg-rose-400 opacity-75" />
      <span className="relative flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}
