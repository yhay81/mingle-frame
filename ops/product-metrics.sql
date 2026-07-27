SELECT
  COUNT(DISTINCT session_hash) AS users,
  COUNT(DISTINCT CASE WHEN name = 'image_added' THEN session_hash END) AS image_added,
  COUNT(DISTINCT CASE WHEN name = 'card_ready' THEN session_hash END) AS card_ready,
  COUNT(DISTINCT CASE WHEN name = 'downloaded' THEN session_hash END) AS downloaded,
  COUNT(DISTINCT CASE WHEN name = 'post_copied' THEN session_hash END) AS post_copied,
  COUNT(DISTINCT CASE WHEN name = 'returned' THEN session_hash END) AS returned,
  COUNT(DISTINCT CASE WHEN occurred_on >= date('now', '-6 days') THEN session_hash END) AS users_7d,
  COUNT(DISTINCT CASE WHEN name = 'downloaded' AND occurred_on >= date('now', '-6 days') THEN session_hash END) AS downloaded_7d
FROM product_events;
