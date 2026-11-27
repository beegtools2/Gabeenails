import React, { useEffect, useState } from 'react';
import { Images, RotateCcw, Save, Upload } from 'lucide-react';
import { SiteImage, useSiteImages } from '../context/SiteImagesContext';
import {
  defaultSiteImage,
  SITE_IMAGE_GROUPS,
  SITE_IMAGE_MAX_BYTES,
  SITE_IMAGE_TYPES,
  siteImageEndpoint,
  type SiteImageKey,
} from '../data/siteImages';

const buttonStyle = 'inline-flex items-center gap-1.5 rounded-xl border border-[#C5A059] bg-[#FDFBF7] px-3 py-2 text-xs font-semibold hover:bg-[#F2E5D5] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

function useImagePreview(file: File | null) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const source = URL.createObjectURL(file);
    setUrl(source);
    return () => URL.revokeObjectURL(source);
  }, [file]);
  return url;
}

interface SiteImagesSettingsProps {
  previewOnly?: boolean;
  onSessionExpired: () => void;
}

function SiteImageCard({ imageKey, label, previewOnly, onSessionExpired }: SiteImagesSettingsProps & { imageKey: SiteImageKey; label: string }) {
  const { versions, setVersion } = useSiteImages();
  const [file, setFile] = useState<File | null>(null);
  const [localImage, setLocalImage] = useState<File | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const previewUrl = useImagePreview(file || localImage || null);
  const customized = localImage === undefined ? Boolean(versions[imageKey]) : Boolean(localImage);

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!selected) return;
    if (!selected.size || selected.size > SITE_IMAGE_MAX_BYTES || !SITE_IMAGE_TYPES.includes(selected.type)) {
      setFeedback({ text: 'Selecciona una imagen PNG, JPG o WebP de hasta 4 MB.', error: true });
      return;
    }
    setFile(selected);
    setFeedback(null);
  }

  async function save(reset: boolean) {
    if (busy || (!reset && !file)) return;
    setBusy(true);
    setFeedback(null);

    try {
      if (!reset) {
        const preview = new Image();
        preview.src = previewUrl;
        try {
          await preview.decode();
        } catch {
          setFeedback({ text: 'No se puede abrir esta imagen. Selecciona otro archivo.', error: true });
          return;
        }
      }

      if (previewOnly) {
        setLocalImage(reset ? null : file);
        setFile(null);
        setFeedback({ text: reset ? 'Imagen original restablecida en la vista previa.' : 'Cambio aplicado a la vista previa. No se publicó.' });
        return;
      }

      const response = await fetch(siteImageEndpoint(imageKey), reset
        ? { method: 'DELETE' }
        : { method: 'PUT', body: file, headers: { 'Content-Type': file!.type } });
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      if (response.status === 413 || response.status === 415) {
        setFeedback({ text: 'La imagen debe ser PNG, JPG o WebP y pesar como máximo 4 MB.', error: true });
        return;
      }
      if (!response.ok) throw new Error('Upload unavailable');
      const result = reset ? null : await response.json();
      if (!reset && typeof result?.version !== 'string') throw new Error('Missing image version');
      setVersion(imageKey, result?.version ?? null);
      setFile(null);
      setFeedback({ text: reset ? 'Imagen original restablecida.' : 'Imagen guardada y publicada.' });
    } catch {
      setFeedback({ text: 'No se pudo guardar el cambio. Inténtalo de nuevo.', error: true });
    } finally {
      setBusy(false);
    }
  }

  const previewClass = 'h-32 w-full object-contain';
  return (
    <div className="min-w-0 space-y-2 rounded-2xl border border-[#E5DAC8] bg-white p-3">
      <div className="rounded-xl border border-[#EFE7DC] bg-[#F8F2E9] p-2">
        {(file || localImage) && previewUrl ? <img src={previewUrl} alt={label} className={previewClass} /> : localImage === null ? (
          <img src={defaultSiteImage(imageKey)} alt={label} loading="lazy" className={previewClass} />
        ) : (
          <SiteImage imageKey={imageKey} alt={label} loading="lazy" className={previewClass} />
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-[#5D3704]">{label}</p>
        <p className="truncate text-[11px] text-[#7A6655]" title={file?.name}>
          {file ? `${file.name} · sin guardar` : localImage ? 'Reemplazo de prueba' : customized ? 'Imagen personalizada' : 'Imagen original comprimida'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className={`${buttonStyle} focus-within:ring-2 focus-within:ring-[#C5A059] ${busy ? 'opacity-50' : ''}`}>
          <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Elegir archivo
          <input type="file" className="sr-only" accept={SITE_IMAGE_TYPES.join(',')} aria-label={`Elegir archivo: ${label}`} onChange={selectFile} disabled={busy} />
        </label>
        {file && (
          <button type="button" className={buttonStyle} disabled={busy || !previewUrl} onClick={() => void save(false)}>
            <Save className="h-3.5 w-3.5" aria-hidden="true" /> {busy ? 'Guardando…' : previewOnly ? 'Aplicar en vista previa' : 'Guardar imagen'}
          </button>
        )}
        {file ? (
          <button type="button" className="cursor-pointer text-[11px] underline" disabled={busy} onClick={() => { setFile(null); setFeedback(null); }}>
            Cancelar selección
          </button>
        ) : customized && (
          <button type="button" className="inline-flex cursor-pointer items-center gap-1 text-[11px] underline disabled:opacity-50" disabled={busy} onClick={() => void save(true)}>
            <RotateCcw className="h-3 w-3" aria-hidden="true" /> {busy ? 'Restableciendo…' : 'Restablecer original'}
          </button>
        )}
      </div>
      {feedback && <p role="status" className={`text-[11px] ${feedback.error ? 'text-rose-800' : 'text-emerald-800'}`}>{feedback.text}</p>}
    </div>
  );
}

export default function SiteImagesSettings({ previewOnly = false, onSessionExpired }: SiteImagesSettingsProps) {
  return (
    <section aria-labelledby="site-images-heading" className="space-y-5 rounded-3xl border border-[#E7DDCE] bg-[#FAF7F2] p-4 sm:p-6">
      <div className="flex items-start gap-3 border-b border-[#E5DAC8] pb-4">
        <Images className="mt-0.5 h-5 w-5 shrink-0 text-[#9C7428]" aria-hidden="true" />
        <div>
          <h3 id="site-images-heading" className="text-base font-bold text-[#5D3704]">Imágenes del Inicio, Marca y Ventanas</h3>
          <p className="mt-1 text-xs text-[#7A6655]">
            {previewOnly ? 'Modo de prueba: los cambios solo se muestran aquí. No se guardan ni se publican.' : 'Guarda cada reemplazo por separado. Si no hay una imagen personalizada, el sitio usa la versión original comprimida.'}
          </p>
        </div>
      </div>
      <p className="text-xs text-[#7A6655]">PNG, JPG o WebP · Hasta 4 MB por imagen. Para conservar el encuadre, usa las mismas proporciones que la original.</p>
      {SITE_IMAGE_GROUPS.map((group) => (
        <div key={group.title} className="space-y-2.5">
          <h4 className="text-xs font-bold text-[#5D3704]">{group.title}</h4>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.images.map((image) => (
              <SiteImageCard key={image.key} imageKey={image.key} label={image.label} previewOnly={previewOnly} onSessionExpired={onSessionExpired} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
