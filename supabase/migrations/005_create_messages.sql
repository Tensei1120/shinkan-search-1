-- メッセージテーブル（管理者↕新入生のやり取り）
CREATE TABLE IF NOT EXISTS messages (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id uuid       NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_type   text        NOT NULL CHECK (sender_type IN ('admin', 'student')),
  body          text        NOT NULL,
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_reservation_id_idx ON messages (reservation_id, created_at);
