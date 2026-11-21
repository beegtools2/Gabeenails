// Safe localStorage wrapper to prevent QuotaExceededError crashes

export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`LocalStorage quota exceeded or failed for key "${key}". Truncating base64 images...`, err);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const lightweight = parsed.map((item) => {
          if (item && typeof item === 'object') {
            const copy = { ...item };
            // Strip oversized heavy voucher photos if quota is tight, but preserve product images
            if (copy.voucherPhoto && typeof copy.voucherPhoto === 'string' && copy.voucherPhoto.length > 500) {
              copy.voucherPhoto = '';
            }
            if (Array.isArray(copy.photos) && copy.photos.length > 5) {
              copy.photos = copy.photos.slice(0, 5);
            }
            return copy;
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }
}

export function safeGetLocalStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch {
    // Ignore
  }
  return fallback;
}
