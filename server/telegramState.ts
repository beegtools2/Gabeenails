import { getDatabase } from '@netlify/database';
import { and, eq, lte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/netlify-db';
import { telegramState } from '../db/schema.ts';

export type TelegramDecision = 'accept' | 'reject';
export type TelegramTargetType = 'store' | 'recharge' | 'appointment';

export interface TelegramAction {
  id: string;
  type: TelegramTargetType;
  targetId: string;
  decision: TelegramDecision;
  at: number;
}

export interface TelegramState {
  offset: number;
  chatId: string;
  messages: Record<string, { text: string; messageId: number }>;
  actions: TelegramAction[];
}

const stateId = 'gabee';
const emptyState = (): TelegramState => ({ offset: 0, chatId: '', messages: {}, actions: [] });
const createDb = () => drizzle({ client: getDatabase() });
let client: ReturnType<typeof createDb> | undefined;
const getDb = () => client ??= createDb();

async function readRow() {
  const [row] = await getDb().select().from(telegramState).where(eq(telegramState.id, stateId));
  return row;
}

export async function readTelegramState(): Promise<TelegramState> {
  return (await readRow())?.state ?? emptyState();
}

export async function readTelegramActions(): Promise<TelegramAction[]> {
  const [row] = await getDb().select({ actions: sql<TelegramAction[]>`${telegramState.state}->'actions'` })
    .from(telegramState).where(eq(telegramState.id, stateId));
  return row?.actions ?? [];
}

export async function claimTelegramPoll(started: number, expires: number): Promise<number | undefined> {
  const db = getDb();
  const [row] = await db.insert(telegramState)
    .values({ id: stateId, state: emptyState(), pollAfter: expires })
    .onConflictDoUpdate({
      target: telegramState.id,
      set: { pollAfter: expires },
      setWhere: lte(telegramState.pollAfter, started),
    })
    .returning({ offset: sql<number>`(${telegramState.state}->>'offset')::bigint`.mapWith(Number) });
  return row?.offset;
}

export async function releaseTelegramPoll(expires: number, nextPoll: number): Promise<void> {
  await getDb().update(telegramState).set({ pollAfter: nextPoll })
    .where(and(eq(telegramState.id, stateId), eq(telegramState.pollAfter, expires)));
}

export async function updateTelegramState(change: (state: TelegramState) => boolean): Promise<boolean> {
  const db = getDb();
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await readRow();
    const state = row?.state ?? emptyState();
    if (!change(state)) return false;

    const updated = row
      ? await db.update(telegramState)
          .set({ state, revision: row.revision + 1 })
          .where(and(eq(telegramState.id, stateId), eq(telegramState.revision, row.revision)))
          .returning({ id: telegramState.id })
      : await db.insert(telegramState).values({ id: stateId, state }).onConflictDoNothing()
          .returning({ id: telegramState.id });

    if (updated.length > 0) return true;
  }
  throw new Error('No se pudo actualizar el estado de Telegram.');
}
