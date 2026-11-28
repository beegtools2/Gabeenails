const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export function isSupabaseStateConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getHeaders(preferUpsert = false): HeadersInit {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  if (preferUpsert) {
    headers.Prefer = 'resolution=merge-duplicates,return=minimal';
  }
  return headers;
}

export async function loadSiteStateFromSupabase<T = unknown>(
  id: string
): Promise<T | null> {
  if (!isSupabaseStateConfigured()) return null;

  try {
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/site_state?id=eq.${encodeURIComponent(
      id
    )}&select=data`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(false),
    });

    if (!response.ok) return null;

    const rows = (await response.json()) as Array<{ data?: T }>;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows[0]?.data ?? null;
  } catch {
    return null;
  }
}

export async function saveSiteStateToSupabase<T = unknown>(
  id: string,
  data: T
): Promise<boolean> {
  if (!isSupabaseStateConfigured()) return false;

  try {
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/site_state?on_conflict=id`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify([
        {
          id,
          data,
          updated_at: new Date().toISOString(),
        },
      ]),
    });

    return response.ok;
  } catch {
    return false;
  }
}
