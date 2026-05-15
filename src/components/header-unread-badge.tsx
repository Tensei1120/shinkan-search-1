"use client";

import { useEffect, useState } from "react";

export function HeaderUnreadBadge({ unreadIds }: { unreadIds: string[] }) {
  const [count, setCount] = useState(unreadIds.length);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("my_read_ids");
      const readIds: Set<string> = stored ? new Set(JSON.parse(stored)) : new Set();
      setCount(unreadIds.filter((id) => !readIds.has(id)).length);
    } catch {}
  }, [unreadIds]);

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
