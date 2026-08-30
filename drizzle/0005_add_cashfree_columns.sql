ALTER TABLE "orders" ADD COLUMN "cashfree_order_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cashfree_payment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_amount" integer;