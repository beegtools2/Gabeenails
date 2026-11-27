import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  defaultSiteImage,
  isSiteImageKey,
  SITE_IMAGES_ENDPOINT,
  siteImageEndpoint,
  type SiteImageKey,
  type SiteImageVersions,
} from '../data/siteImages';

interface SiteImagesState {
  versions: SiteImageVersions;
  setVersion: (key: SiteImageKey, version: string | null) => void;
}

const SiteImagesContext = createContext<SiteImagesState>({ versions: {}, setVersion: () => {} });

export function SiteImagesProvider({ children }: React.PropsWithChildren) {
  const [versions, setVersions] = useState<SiteImageVersions>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch(SITE_IMAGES_ENDPOINT, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((manifest: unknown) => {
        if (!manifest || typeof manifest !== 'object' || controller.signal.aborted) return;
        const loaded: SiteImageVersions = {};
        for (const [key, version] of Object.entries(manifest)) {
          if (isSiteImageKey(key) && typeof version === 'string' && version) loaded[key] = version;
        }
        setVersions((current) => ({ ...loaded, ...current }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const patternVersion = versions['window-pattern'];
  useEffect(() => {
    if (!patternVersion) return;
    const property = '--site-window-pattern';
    const source = siteImageEndpoint('window-pattern', patternVersion);
    const image = new Image();
    image.onload = () => document.documentElement.style.setProperty(property, `url("${source}")`);
    image.src = source;
    return () => {
      image.onload = null;
      document.documentElement.style.removeProperty(property);
    };
  }, [patternVersion]);

  function setVersion(key: SiteImageKey, version: string | null) {
    setVersions((current) => ({ ...current, [key]: version ?? undefined }));
  }

  return <SiteImagesContext.Provider value={{ versions, setVersion }}>{children}</SiteImagesContext.Provider>;
}

export function useSiteImages() {
  return useContext(SiteImagesContext);
}

type SiteImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'slot'> & {
  imageKey: SiteImageKey;
};

export function SiteImage({ imageKey, onError, ...props }: SiteImageProps) {
  const { versions } = useSiteImages();
  const version = versions[imageKey];
  const fallback = defaultSiteImage(imageKey);
  const source = version ? siteImageEndpoint(imageKey, version) : fallback;

  return (
    <img
      {...props}
      src={source}
      onError={(event) => {
        const image = event.currentTarget;
        if (source !== fallback && image.getAttribute('src') === source) {
          image.src = fallback;
        } else {
          onError?.(event);
        }
      }}
    />
  );
}
