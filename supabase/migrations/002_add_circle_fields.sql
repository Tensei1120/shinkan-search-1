-- ① circles にカテゴリ・大学を追加
ALTER TABLE circles
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other'
  CHECK (category IN ('sports','culture','academic','music','outdoor','food','incircle','other'));

ALTER TABLE circles
  ADD COLUMN IF NOT EXISTS university text;

-- ② reservations に cancelled ステータスを追加
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending','approved','rejected','cancelled'));

-- ③ キャンセル時の reserved_count デクリメント用 RPC
CREATE OR REPLACE FUNCTION decrement_reserved_count(p_event_id uuid)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE events
  SET reserved_count = GREATEST(0, reserved_count - 1)
  WHERE id = p_event_id;
$$;
