import React from 'react';
import { GabeeBeeMark } from './GabeeBeeMark';
import { X, GraduationCap, Award, Calendar, CheckCircle2, Sparkles, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoursesModal: React.FC<CoursesModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useApp();

  if (!isOpen) return null;

  const courses = [
    {
      title: 'Masterclass: Softgel & Manicura Rusa',
      badge: 'Nivel Inicial a Pro',
      duration: 'Intensivo 2 Días (12 Horas)',
      description: 'Aprende la técnica rusa combinada con fresas diamantadas, preparación sin daño, nivelación perfecta y adhesión de tips Softgel con durabilidad de hasta 4 semanas.',
      includes: ['Kit de inicio profesional incluido', 'Certificado físico y digital con código de validación', 'Acceso a grupo VIP de asesoría continua'],
      price: 'S/. 380',
    },
    {
      title: 'Workshop: Polygel & Esculpido Híbrido',
      badge: 'Perfeccionamiento',
      duration: '1 Día Intensivo (7 Horas)',
      description: 'Domina el control de la perla de polygel, manejo de moldes dual forms y esculpido con pincel y alcohol isopropílico para estructuras arquitectónicas livianas.',
      includes: ['Práctica en modelos reales', 'Guía paso a paso ilustrada', 'Coffee break y catering gourmet'],
      price: 'S/. 290',
    },
    {
      title: 'Nail Art 2026: Cromo Líquido, 3D & Relieves',
      badge: 'Especialización Artística',
      duration: '1 Día (6 Horas)',
      description: 'Técnicas avanzadas de pintura a mano alzada, lazos coquette 3D con resina uv, efectos velvet cat-eye multidimensional y efecto mármol cuarzo.',
      includes: ['Materiales de alta gama en clase', 'Plantillas de práctica descargables', 'Certificado de especialización'],
      price: 'S/. 250',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-[#E8DEC9] flex items-center justify-between"
          style={{
            backgroundColor: '#FAF7F2',
            backgroundImage: 'var(--site-window-pattern)',
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-3 bg-white/85 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-[#D5C6B1]">
            <GabeeBeeMark size="sm" />
            <div>
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704] block">
                Academia Profesional · Gabee Studio
              </span>
              <h3 className="text-lg font-['Cinzel'] font-bold text-[#5D3704] leading-tight">
                Cursos & Masterclasses Presenciales
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5D3704] bg-white/90 hover:bg-white rounded-full shadow-xs transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-4 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/20 flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-[#5D3704] shrink-0 mt-0.5" />
            <div className="text-xs font-['Marcellus'] text-[#5D3704] leading-relaxed">
              <strong>Capacítate con Gabriela:</strong> Aprende de forma presencial con grupos reducidos (máximo 4 alumnas por fecha) para garantizar atención individualizada y corrección técnica en tiempo real.
            </div>
          </div>

          <div className="space-y-4">
            {courses.map((course, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-[#E9DFCE] shadow-2xs hover:border-[#5D3704]/40 transition-all flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-['Cinzel'] font-bold text-base text-[#5D3704]">
                        {course.title}
                      </h4>
                      <span className="text-[9px] font-['Cinzel'] font-bold uppercase bg-[#5D3704] text-[#FAF7F2] px-2 py-0.5 rounded">
                        {course.badge}
                      </span>
                    </div>
                    <span className="text-xs font-['Cinzel'] font-bold text-[#8C7460] mt-1 block">
                      {course.duration}
                    </span>
                  </div>

                  <span className="text-lg font-bold font-mono text-[#5D3704] sm:text-right">
                    {course.price}
                  </span>
                </div>

                <p className="font-['Marcellus'] text-xs text-[#5D3704] leading-relaxed mb-3">
                  {course.description}
                </p>

                <div className="space-y-1.5 mb-4 pt-2 border-t border-[#F0E6D8]">
                  {course.includes.map((inc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-['Marcellus'] text-[#5D3704]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5D3704] shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${'51' + (settings.whatsappNumber || '934403311').replace(/[^0-9]/g, '').replace(/^51/, '')}&text=${encodeURIComponent(
                      `Hola Gabriela! Quisiera información y próximas fechas para el curso: ${course.title}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-4 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/30 text-xs font-['Cinzel'] font-bold text-[#5D3704] hover:bg-[#ebdccf] transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#5D3704]" />
                    <span>Consultar Fechas por WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t border-[#E8DEC9] flex items-center justify-between"
          style={{
            backgroundColor: '#FAF7F2',
            backgroundImage: 'var(--site-window-pattern)',
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <span className="text-xs font-['Marcellus'] text-[#5D3704]">
            Clases en nuestro estudio de Surco, Lima.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/30 text-xs font-['Cinzel'] font-bold text-[#5D3704] hover:bg-[#ebdccf] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
