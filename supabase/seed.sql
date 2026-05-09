-- ダミーデータ

-- Circles
insert into circles (id, name, description, contact_email) values
  ('11111111-0000-0000-0000-000000000001', 'テニスサークル SMASH', '初心者大歓迎！週3回活動しています。新歓では初心者向け体験会を開催します。', 'smash@example.com'),
  ('11111111-0000-0000-0000-000000000002', '写真部 Shutter', 'カメラ好き集まれ！風景・ポートレート・スナップなど幅広く活動中。機材貸し出しあり。', 'shutter@example.com'),
  ('11111111-0000-0000-0000-000000000003', 'プログラミングサークル Code+', 競プロ・Web開発・ゲーム制作まで何でもあり！LT会や合宿も開催しています。', 'codeplus@example.com'),
  ('11111111-0000-0000-0000-000000000004', '料理研究会 Saveur', '月2回のレシピ研究会や季節ごとの料理イベントを開催。食べることが好きな人も歓迎！', 'saveur@example.com');

-- Events
insert into events (circle_id, title, description, date, location, capacity, status) values
  -- テニスサークル SMASH
  ('11111111-0000-0000-0000-000000000001', '新歓テニス体験会①', 'ラケット・シューズ貸し出しあり！初めての方でも丁寧に教えます。終了後は近くのカフェで懇親会予定。', now() + interval '7 days', '第1テニスコート', 15, 'open'),
  ('11111111-0000-0000-0000-000000000001', '新歓テニス体験会②', '①に参加できなかった方向けの第2回です。同内容で開催します。', now() + interval '14 days', '第1テニスコート', 15, 'open'),
  ('11111111-0000-0000-0000-000000000001', '新歓バーベキュー大会', '近くの公園でBBQ！お肉・野菜は全て用意します。食費無料。', now() + interval '21 days', '○○公園 BBQエリア', 30, 'open'),

  -- 写真部 Shutter
  ('11111111-0000-0000-0000-000000000002', '新歓 写真撮影体験', 'キャンパスを歩きながら写真撮影体験。スマホでも一眼でも参加OK！撮った写真はその日にプリントします。', now() + interval '5 days', '正門集合', 10, 'open'),
  ('11111111-0000-0000-0000-000000000002', '新歓 写真展＆交流会', '部員の作品展示と、新入生との交流会。軽食あり。', now() + interval '10 days', '学生ホール 展示スペース', 20, 'open'),

  -- プログラミングサークル Code+
  ('11111111-0000-0000-0000-000000000003', '新歓LT会「俺の好きな技術」', '部員が5分ずつ好きな技術についてLT！その後は自由交流タイム。プログラミング未経験者も大歓迎。', now() + interval '3 days', '情報棟 302教室', 25, 'open'),
  ('11111111-0000-0000-0000-000000000003', 'Webアプリ開発ハンズオン', 'HTML/CSS/JavaScriptを使って簡単なWebアプリを作る体験会。ノートPC持参必須。', now() + interval '10 days', '情報棟 PCルーム', 20, 'open'),
  ('11111111-0000-0000-0000-000000000003', '新歓ゲーム大会', 'ボードゲーム・マリカー・スマブラ大会！プログラミング関係なく楽しめます。', now() + interval '17 days', '学生ホール', 40, 'open'),

  -- 料理研究会 Saveur
  ('11111111-0000-0000-0000-000000000004', '新歓 春の洋食レシピ会', '人気シェフ出身のOBを招いてパスタ&リゾット作り体験。食材費500円のみ負担。', now() + interval '6 days', '家庭科実習室', 12, 'open'),
  ('11111111-0000-0000-0000-000000000004', '新歓 スイーツ作り体験', 'ティラミスとパンナコッタを作って食べよう！甘いもの好き集まれ。', now() + interval '13 days', '家庭科実習室', 12, 'open');

-- ダミー予約（reserved_countはトリガーで自動更新）
-- LT会（残り少なめにする）
with ev as (select id from events where title = '新歓LT会「俺の好きな技術」' limit 1)
insert into reservations (event_id, name, email, grade, department, note, status)
select ev.id, name, email, grade, department, note, status from ev,
(values
  ('田中 太郎', 'tanaka@example.com', '1年生', '工学部 情報工学科', 'プログラミング初心者です！', 'approved'),
  ('佐藤 花子', 'sato@example.com', '1年生', '理学部 数学科', '', 'approved'),
  ('鈴木 一郎', 'suzuki@example.com', '2年生', '経済学部 経済学科', 'Pythonすこし触ったことあります', 'pending'),
  ('山田 美咲', 'yamada@example.com', '1年生', '文学部 英文学科', 'プログラミング全くわかりませんが大丈夫ですか？', 'pending'),
  ('中村 健太', 'nakamura@example.com', '1年生', '理学部 物理学科', '', 'pending')
) as t(name, email, grade, department, note, status);

-- テニス体験会①（少し埋まってる）
with ev as (select id from events where title = '新歓テニス体験会①' limit 1)
insert into reservations (event_id, name, email, grade, department, note, status)
select ev.id, name, email, grade, department, note, status from ev,
(values
  ('高橋 さくら', 'takahashi@example.com', '1年生', '体育学部 スポーツ学科', '', 'approved'),
  ('伊藤 大輔', 'ito@example.com', '1年生', '工学部 機械工学科', 'テニス未経験です', 'pending'),
  ('渡辺 麻衣', 'watanabe@example.com', '1年生', '文学部 日本文学科', '', 'pending')
) as t(name, email, grade, department, note, status);
