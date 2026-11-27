const ASSETS = '/assets/aistudio/';

export const SITE_IMAGE_GROUPS = [
  {
    title: 'Términos y Condiciones',
    images: [
      { key: 'terms-1', label: 'Lámina 1', fallback: `${ASSETS}IMG_9360_1bdc15b7.PNG` },
      { key: 'terms-2', label: 'Lámina 2', fallback: `${ASSETS}IMG_9361_aba21d4b.PNG` },
      { key: 'terms-3', label: 'Lámina 3', fallback: `${ASSETS}IMG_9362_07aa3036.PNG` },
      { key: 'terms-4', label: 'Lámina 4', fallback: `${ASSETS}IMG_9363_3d2b4614.PNG` },
    ],
  },
  {
    title: 'Beneficios de Gabee Studio',
    images: [
      { key: 'benefits-1', label: 'Lámina 1', fallback: `${ASSETS}page_beneficios_01.png` },
      { key: 'benefits-2', label: 'Lámina 2', fallback: `${ASSETS}page_beneficios_02.png` },
      { key: 'benefits-3', label: 'Lámina 3', fallback: `${ASSETS}page_beneficios_03.png` },
    ],
  },
  {
    title: 'Inicio y marca',
    images: [
      { key: 'hero-logo', label: 'Logo principal · Gabee Nail Artist', fallback: `${ASSETS}Logo original.png` },
      { key: 'bee-coin', label: 'Moneda de BeeCoins', fallback: `${ASSETS}Photoroom_20261028_151229_d08f9cc8.png` },
      { key: 'catbee-floating', label: 'Catbee flotante', fallback: `${ASSETS}gatobeja_transparent.png` },
      { key: 'catbee-chat', label: 'Avatar de Catbee en el chat', fallback: `${ASSETS}catbee_avatar.png` },
      { key: 'press-on-cover', label: 'Portada de Press On Nails', fallback: `${ASSETS}PRESS ON NAILS.jpeg` },
    ],
  },
  {
    title: 'Guías de medidas y ventanas',
    images: [
      { key: 'coin-guide', label: 'Método de la moneda', fallback: `${ASSETS}M_TODO_DE_LA_MONEDA_fc5fdd97.png` },
      { key: 'tape-guide', label: 'Método de la cinta', fallback: `${ASSETS}M_TODO_DE_LA_CINTA_93ee9fef.png` },
      { key: 'window-pattern', label: 'Patrón de abejitas', fallback: `${ASSETS}Inicio_5d3704_dd6e8988.png` },
    ],
  },
] as const;

export type SiteImageKey = (typeof SITE_IMAGE_GROUPS)[number]['images'][number]['key'];
export type SiteImageVersions = Partial<Record<SiteImageKey, string>>;

const defaults = new Map<string, string>();
for (const group of SITE_IMAGE_GROUPS) {
  for (const image of group.images) defaults.set(image.key, image.fallback);
}

export const SITE_IMAGES_ENDPOINT = '/api/site-images';
export const SITE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const SITE_IMAGE_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/webp'];

export function isSiteImageKey(key: unknown): key is SiteImageKey {
  return typeof key === 'string' && defaults.has(key);
}

export function defaultSiteImage(key: SiteImageKey): string {
  return defaults.get(key)!;
}

export function siteImageEndpoint(key: SiteImageKey, version?: string): string {
  const query = new URLSearchParams({ image: key });
  if (version) query.set('v', version);
  return `${SITE_IMAGES_ENDPOINT}?${query}`;
}
