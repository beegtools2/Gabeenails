import { ReviewItem } from '../types';
import { safeGetLocalStorage, safeSetLocalStorage } from './storageUtils';

/**
 * Utilidades compartidas para garantizar que las reseñas ficticias nunca
 * reaparezcan y que una reseña eliminada desde /admin se mantenga eliminada.
 */

export const DELETED_REVIEW_IDS_STORAGE_KEY = 'gabee_deleted_review_ids_v1';

/** IDs usados por el antiguo catálogo semilla. Ya no se crean ni se muestran. */
export const SEED_REVIEW_IDS = ['review-01', 'review-02', 'review-03'];

const BROKEN_MEDIA_VALUES = [
  'none',
  'no-image',
  'null',
  'undefined',
  '/assets/aistudio/PO_1_f5e6a392.JPG',
];

export function getDeletedReviewIds(): string[] {
  const ids = safeGetLocalStorage<string[]>(DELETED_REVIEW_IDS_STORAGE_KEY, []);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

/** Registra IDs eliminados para que snapshots remotos antiguos no los revivan. */
export function markReviewsAsDeleted(ids: string[]): void {
  const validIds = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (validIds.length === 0) return;
  const merged = Array.from(new Set([...getDeletedReviewIds(), ...validIds]));
  safeSetLocalStorage(DELETED_REVIEW_IDS_STORAGE_KEY, JSON.stringify(merged));
}

export function unmarkReviewsAsDeleted(ids: string[]): void {
  const remove = new Set(ids);
  const remaining = getDeletedReviewIds().filter((id) => !remove.has(id));
  safeSetLocalStorage(DELETED_REVIEW_IDS_STORAGE_KEY, JSON.stringify(remaining));
}

export function isHiddenReviewId(id?: string | null): boolean {
  if (!id) return false;
  return SEED_REVIEW_IDS.includes(id) || getDeletedReviewIds().includes(id);
}

/** Filtra semillas/tombstones y limpia referencias de imagen rotas. */
export function sanitizeReviews<T extends ReviewItem>(items: T[]): T[] {
  return items
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        !isHiddenReviewId(item.id)
    )
    .map((item) => {
      const media = item.mediaUrl?.trim();
      if (!media || BROKEN_MEDIA_VALUES.includes(media)) {
        return { ...item, mediaUrl: undefined };
      }
      return item;
    });
}
