import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  defaultSiteImage,
  isSiteImageKey,
  SITE_IMAGES_ENDPOINT,
  siteImageEndpoint,
  type SiteImageKey,
  type SiteImageVersions,
} from '../data/siteImages';
import {
  loadSiteStateFromSupabase,
  saveSiteStateToSupabase,
} from '../services/supabaseStateService';

export type SiteImage = typeof defaultSiteImage;
const SUPABASE_IMAGE_VERSIONS_ID = 'site_image_versions';

interface SiteImagesState {
  versions: SiteImageVersions;
  setVersion: (key: SiteImageKey, version: string | null) => void;
}

const SiteImagesContext = createContext<SiteImagesState>({
  versions: {},
  setVersion: () => {},
});

function sanitizeVersions(input: unknown): SiteImageVersions {
  if (!input || typeof input !== 'object') return {};
  const next: SiteImageVersions = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (isSiteImageKey(key) && typeof value === 'string' && value.trim()) {
      next[key] = value.trim();
    }
  }
  return next;
}

export function SiteImagesProvider({ children }: { children: React.ReactNode }) {
  const [versions, setVersions] = useState<SiteImageVersions>({});

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    loadSiteStateFromSupabase<SiteImageVersions>(SUPABASE_IMAGE_VERSIONS_ID)
      .then((remoteVersions) => {
        if (!active || controller.signal.aborted) return;
        const sanitized = sanitizeVersions(remoteVersions);
        if (Object.keys(sanitized).length > 0) {
          setVersions((prev) => ({ ...prev, ...sanitized }));
        }
      })
      .catch(() => {});

    fetch(SITE_IMAGES_ENDPOINT, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((manifest: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (!manifest || typeof manifest !== 'object') return;
        const sanitized = sanitizeVersions(manifest);
        if (Object.keys(sanitized).length > 0) {
          setVersions((prev) => ({ ...sanitized, ...prev }));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const setVersion = (key: SiteImageKey, version: string | null) => {
    setVersions((prev) => {
      const next: SiteImageVersions = { ...prev };
      if (version && version.trim()) {
        next[key] = version.trim();
      } else {
        delete next[key];
      }
      void saveSiteStateToSupabase<SiteImageVersions>(
        SUPABASE_IMAGE_VERSIONS_ID,
        next
      );
      return next;
    });
  };

  return (
    <SiteImagesContext.Provider value={{ versions, setVersion }}>
      {children}
    </SiteImagesContext.Provider>
  );
}

export function useSiteImages() {
  return useContext(SiteImagesContext);
}

export function getSiteImageSrc(
  key: SiteImageKey,
  versions?: SiteImageVersions
): string {
  const version = versions?.[key];
  if (version) {
    return siteImageEndpoint(key, version);
  }
  return defaultSiteImage(key);
}
