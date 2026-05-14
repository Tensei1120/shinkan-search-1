-- メッセージテーブル（管理者↔新入生のやり取り）
CREATE TABLE IF NOT EXISTS messages (
  id             uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id uuid        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_type    text        NOT NULL CHECK (sender_type IN ('admin', 'student')),
  body           text        NOT NULL,
  read_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_reservation_id_idx ON messages (reservation_id, created_at);

-- RLS有効化（APIはservice roleで操作するためRLSをバイパスする）
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 認証済み管理者: 自分のサークルの予約に紐づくメッセージを読み書き可能
CREATE POLICY "messages_admin" ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN events e ON e.id = r.event_id
      JOIN circle_admins ca ON ca.circle_id = e.circle_id
      WHERE r.id = messages.reservation_id
        AND ca.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN events e ON e.id = r.event_id
      JOIN circle_admins ca ON ca.circle_id = e.circle_id
      WHERE r.id = messages.reservation_id
        AND ca.user_id = auth.uid()
    )
  );
