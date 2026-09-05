ALTER TABLE "orders" ADD COLUMN "order_seq" serial NOT NULL;--> statement-breakpoint
-- Renumber existing rows chronologically (by created_at) starting at
-- TVA100001, instead of relying on whatever physical row order Postgres
-- used to backfill the new serial column.
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM "orders"
)
UPDATE "orders" SET "order_seq" = ranked.rn + 100000 FROM ranked WHERE "orders"."id" = ranked."id";--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('orders', 'order_seq'), (SELECT COALESCE(MAX("order_seq"), 100000) FROM "orders"));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_seq_unique" UNIQUE("order_seq");
