import { bigint, integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import type { TelegramState } from '../server/telegramState.ts';

export const telegramState = pgTable('telegram_state', {
  id: text('id').primaryKey(),
  revision: integer('revision').notNull().default(0),
  pollAfter: bigint('poll_after', { mode: 'number' }).notNull().default(0),
  state: jsonb('state').$type<TelegramState>().notNull(),
});
