import React, { useState } from 'react';
import { GabeeBeeMark } from './GabeeBeeMark';
import { Mail, BookOpen, ExternalLink, MapPin } from 'lucide-react';
import { LibroReclamacionesModal } from './LibroReclamacionesModal';
import { useApp } from '../context/AppContext';
import { INITIAL_SETTINGS } from '../data/catalogData';

const FOOTER_FALLBACK_ADDRESS = 'Av. Arnaldo Márquez 1165 N° 168';

export const Footer: React.FC = () => {
  const [isLibroOpen, setIsLibroOpen] = useState(false);
  const { settings } = useApp();

  // Usa la dirección guardada en "CONFIGURACIÓN Y TARIFAS"; si aún no se
  // personalizó, mantiene la dirección original del pie de página.
  const configuredAddress = (settings?.studioAddress || '').trim();
  const footerAddress =
    configuredAddress && configuredAddress !== INITIAL_SETTINGS.studioAddress?.trim()
      ? configuredAddress
      : FOOTER_FALLBACK_ADDRESS;

  return (
    <>
      <footer className="relative border-t border-[#DFC89E]/80 bg-[#F5E7C8]/65 backdrop-blur-md pt-12 pb-8 shadow-[0_-1px_0_rgba(223,200,158,0.7)]">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main 4-Column Layout: mismo acabado suave y dorado que el encabezado */}
          <div className="bg-gradient-to-br from-[#FAF0D9] via-[#F3E4C3] to-[#EAD6AE] rounded-[2rem] p-6 sm:p-10 border border-[#DFC89E]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_1px_0_rgba(223,200,158,0.5)] mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-center lg:items-start text-center lg:text-left">
              {/* COL 1: Gabee Studio Brand & Slogan */}
              <div className="flex flex-col items-center justify-center space-y-3 text-center">
                <div className="flex items-center justify-center">
                  <GabeeBeeMark size="md" />
                </div>
                <p className="font-['Marcellus'] text-xs text-[#5D3704] leading-relaxed">
                  Studio Profesional en Lima, Perú.
                </p>
                <p className="font-['Cinzel'] font-bold text-xs text-[#5D3704] tracking-wide uppercase">
                  DONDE EL AMOR Y EL ARTE SE ENCUENTRAN
                </p>
              </div>

              {/* COL 2: SIGUENOS EN NUESTRAS REDES SOCIALES */}
              <div className="flex flex-col items-center lg:items-start space-y-3">
                <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] uppercase tracking-wider text-center">
                  SÍGUENOS EN<br />NUESTRAS REDES SOCIALES ♥
                </h4>
                <div className="space-y-2 text-xs font-['Marcellus'] text-[#5D3704] w-full max-w-[240px]">
                  {/* YouTube */}
                  <a
                    href="https://www.youtube.com/@GabeenailsArt"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center lg:justify-start gap-2.5 p-1.5 rounded-xl hover:bg-[#F3E4C3] transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FFF9EC]/85 border border-[#DFC89E] flex items-center justify-center text-[#5D3704] shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-3.5 h-3.5 fill-[#5D3704]" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                    <span className="font-medium group-hover:underline">@gabeenailsArt</span>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/gabeenailsart/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center lg:justify-start gap-2.5 p-1.5 rounded-xl hover:bg-[#F3E4C3] transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FFF9EC]/85 border border-[#DFC89E] flex items-center justify-center text-[#5D3704] shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-3.5 h-3.5 fill-[#5D3704]" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <span className="font-medium group-hover:underline">@gabeenailsart</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/gabeenailsart/about/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center lg:justify-start gap-2.5 p-1.5 rounded-xl hover:bg-[#F3E4C3] transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FFF9EC]/85 border border-[#DFC89E] flex items-center justify-center text-[#5D3704] shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-3.5 h-3.5 fill-[#5D3704]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <span className="font-medium group-hover:underline">@gabeenailsart</span>
                  </a>

                  {/* Threads */}
                  <a
                    href="https://www.threads.net/@gabeenailsart"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center lg:justify-start gap-2.5 p-1.5 rounded-xl hover:bg-[#F3E4C3] transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FFF9EC]/85 border border-[#DFC89E] flex items-center justify-center text-[#5D3704] shrink-0 group-hover:scale-105 transition-transform">
                      <span className="font-bold text-xs">@</span>
                    </div>
                    <span className="font-medium group-hover:underline">@gabeenailsart</span>
                  </a>
                </div>
              </div>

              {/* COL 3: INFORMACIÓN Y CONTACTO */}
              <div className="flex flex-col items-center lg:items-start space-y-3">
                <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] uppercase tracking-wider">
                  Información y Contacto
                </h4>
                <div className="space-y-2 text-xs font-['Marcellus'] text-[#5D3704]">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Mail className="w-4 h-4 text-[#5D3704] shrink-0" />
                    <a
                      href="mailto:beeg.tools@gmail.com"
                      className="hover:underline font-medium"
                    >
                      beeg.tools@gmail.com
                    </a>
                  </div>

                  <div className="pt-1">
                    <p className="font-['Cinzel'] font-bold text-sm text-[#5D3704]">
                      BEETOOLS E.I.R.L.
                    </p>
                    <p className="font-mono text-xs text-[#5D3704]/90 mt-0.5">
                      RUC: 20614757257
                    </p>
                  </div>

                  {/* Mini mapa con la dirección exacta del local */}
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Av.%20Arnaldo%20M%C3%A1rquez%201165%20N%C2%B0%20168%2C%20Lima%2C%20Per%C3%BA"
                    target="_blank"
                    rel="noreferrer"
                    title="Ver dirección en Google Maps"
                    className="mt-2 flex items-center justify-center lg:justify-start gap-2.5 p-2 rounded-xl border border-[#DFC89E]/80 bg-[#FFF9EC]/70 hover:bg-[#FFFDF6] transition-colors group/map"
                  >
                    <span
                      className="relative w-14 h-14 shrink-0 rounded-lg border border-[#DFC89E]/70 overflow-hidden"
                      style={{
                        background:
                          'linear-gradient(0deg, transparent 45%, rgba(255,253,247,0.8) 45%, rgba(255,253,247,0.8) 55%, transparent 55%), linear-gradient(90deg, transparent 45%, rgba(255,253,247,0.75) 45%, rgba(255,253,247,0.75) 55%, transparent 55%), #E7DCC6',
                      }}
                    >
                      <MapPin
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-[#C0392B] drop-shadow-sm"
                        fill="#D64545"
                        stroke="#FFFDF9"
                        strokeWidth={1.5}
                      />
                    </span>
                    <span className="font-medium leading-snug text-left group-hover/map:underline">
                      {footerAddress}
                    </span>
                  </a>

                </div>
              </div>

              {/* COL 4: LIBRO DE RECLAMACIONES */}
              <div className="flex flex-col items-center space-y-3">
                <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] uppercase tracking-wider">
                  LIBRO DE RECLAMACIONES
                </h4>

                <button
                  type="button"
                  onClick={() => setIsLibroOpen(true)}
                  className="flex flex-col items-center p-4 rounded-2xl bg-[#FFF9EC]/75 hover:bg-[#FFFDF6] border border-[#DFC89E] transition-all group cursor-pointer shadow-[0_1px_0_rgba(212,175,55,0.2)] hover:scale-105"
                  title="Abrir Libro de Reclamaciones Virtual"
                >
                  {/* Open book with pencil illustration matching sketch */}
                  <span className="w-20 h-16 relative flex items-center justify-center mb-1 text-[#5D3704]">
                    <svg
                      viewBox="0 0 100 80"
                      className="w-16 h-14 stroke-[#5D3704] fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round"
                    >
                      {/* Left page */}
                      <path d="M 50 20 Q 30 14 10 18 L 10 65 Q 30 61 50 67 Z" fill="#FFFDF9" />
                      <line x1="16" y1="28" x2="44" y2="25" />
                      <line x1="16" y1="36" x2="44" y2="33" />
                      <line x1="16" y1="44" x2="44" y2="41" />
                      <line x1="16" y1="52" x2="44" y2="49" />

                      {/* Right page */}
                      <path d="M 50 20 Q 70 14 90 18 L 90 65 Q 70 61 50 67 Z" fill="#FFFDF9" />
                      <line x1="56" y1="25" x2="84" y2="28" />
                      <line x1="56" y1="33" x2="84" y2="36" />
                      <line x1="56" y1="41" x2="84" y2="44" />
                      <line x1="56" y1="49" x2="84" y2="52" />

                      {/* Spine */}
                      <line x1="50" y1="20" x2="50" y2="67" />

                      {/* Pencil on right side */}
                      <g transform="rotate(-30 70 45)">
                        <rect x="58" y="32" width="22" height="5" rx="1" fill="#D4AF37" stroke="#5D3704" />
                        <polygon points="58,32 58,37 52,34.5" fill="#5D3704" stroke="#5D3704" />
                      </g>
                    </svg>
                  </span>

                  <span className="text-[11px] font-['Cinzel'] font-bold text-[#5D3704] underline underline-offset-4 flex items-center gap-1">
                    <span>Libro de Reclamaciones</span>
                    <ExternalLink className="w-3 h-3 inline" />
                  </span>
                  <span className="text-[9px] font-['Marcellus'] text-[#5D3704]/70 mt-0.5">
                    Ley N° 29571 · Indecopi
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar: BEETOOLS EIRL • DERECHOS RESERVADOS */}
          <div className="text-center pt-5 mt-2 border-t border-[#DFC89E]">
            <p className="font-['Cinzel'] font-bold text-xs sm:text-sm tracking-widest text-[#5D3704] uppercase">
              BEETOOLS EIRL • DERECHOS RESERVADOS
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Libro de Reclamaciones */}
      <LibroReclamacionesModal
        isOpen={isLibroOpen}
        onClose={() => setIsLibroOpen(false)}
      />
    </>
  );
};
