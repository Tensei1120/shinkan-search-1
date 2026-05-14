-- events にタグ列を追加
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tags text;
