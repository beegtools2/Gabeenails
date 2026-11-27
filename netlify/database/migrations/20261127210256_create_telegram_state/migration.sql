CREATE TABLE "telegram_state" (
	"id" text PRIMARY KEY,
	"revision" integer DEFAULT 0 NOT NULL,
	"poll_after" bigint DEFAULT 0 NOT NULL,
	"state" jsonb NOT NULL
);
