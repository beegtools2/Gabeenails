import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
  altText?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose, altText = 'Vista ampliada' }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (imageUrl) {
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 w-screen h-screen z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn cursor-zoom-out"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center bg-transparent cursor-default"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-all cursor-pointer shadow-xl border border-white/40 z-30 group"
          title="Cerrar visor"
          aria-label="Cerrar visor"
        >
          <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>

        <img
          src={imageUrl}
          alt={altText}
          className="w-auto h-auto max-w-full max-h-[82vh] object-contain rounded-3xl border border-white/20 shadow-2xl"
        />
      </div>
    </div>,
    document.body
  );
};
