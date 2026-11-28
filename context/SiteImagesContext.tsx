import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  defaultSiteImage,
  isSiteImageKey,
  type SiteImageKey,
  type SiteImageVersions,
} from '../data/siteImages';
import {
  loadSiteStateFromSupabase,
  saveSiteStateToSupabase,
} from '../services/supabaseStateService';

export const SiteImage = defaultSiteImage;
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
    let active = true;

    loadSiteStateFromSupabase<SiteImageVersions>(SUPABASE_IMAGE_VERSIONS_ID)
      .then((remoteVersions) => {
        if (!active) return;
        const sanitized = sanitizeVersions(remoteVersions);
        if (Object.keys(sanitized).length > 0) {
          setVersions((prev) => ({ ...prev, ...sanitized }));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
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
  const baseSrc = defaultSiteImage(key);
  const version = versions?.[key];
  if (version) {
    const encodedPath = encodeURI(baseSrc);
    const separator = encodedPath.includes('?') ? '&' : '?';
    return `${encodedPath}${separator}v=${encodeURIComponent(version)}`;
  }
  return encodeURI(baseSrc);
}
