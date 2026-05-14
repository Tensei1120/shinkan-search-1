-- circles にジャンル・タグ列を追加
ALTER TABLE circles
  ADD COLUMN IF NOT EXISTS genre text;
