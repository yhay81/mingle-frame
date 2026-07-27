CREATE TABLE product_events (
  session_hash TEXT NOT NULL,
  name TEXT NOT NULL CHECK (
    name IN (
      'visited',
      'image_added',
      'card_ready',
      'downloaded',
      'post_copied',
      'returned'
    )
  ),
  occurred_on TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (session_hash, name, occurred_on)
);

CREATE INDEX product_events_date_idx ON product_events (occurred_on);
