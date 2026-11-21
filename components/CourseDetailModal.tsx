import React from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, ExternalLink, ClipboardList, GraduationCap } from 'lucide-react';
import { GabeeLogo } from './GabeeLogo';

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ isOpen, onClose }) => {
  const { selectedCourseItem } = useApp();

  if (!isOpen || !selectedCourseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#5D3704] bg-white/80 hover:bg-[#EAE0D0] rounded-full cursor-pointer z-10 shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Title */}
        <div className="mb-4">
          <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#8C6B1C] block">
            Especialización Profesional · Gabee Studio
          </span>
          <h3 className="text-xl font-['Cinzel'] font-bold text-[#5D3704] leading-tight mt-0.5">
            {selectedCourseItem.title}
          </h3>
        </div>

        {/* Modal Scrollable Body */}
        <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1 font-['Marcellus'] text-[#5D3704]">
          {/* Featured Large Cover Photo */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-[#E6DBC9] shadow-md bg-[#F0E6D8]">
            <img
              src={selectedCourseItem.image || '/src/assets/images/nail_chrome_cateye_1792392507727.jpg'}
              alt={selectedCourseItem.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/src/assets/images/nail_chrome_cateye_1792392507727.jpg';
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-4 right-4 z-10 bg-[#FAF7F2]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D4AF37] shadow-lg">
              <span className="font-mono text-sm font-bold text-[#5D3704]">
                {selectedCourseItem.priceLabel || `S/. ${selectedCourseItem.price.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Description */}
          {selectedCourseItem.description && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#DDD1BF] leading-relaxed">
              <p>{selectedCourseItem.description}</p>
            </div>
          )}

          {/* What You Will Learn */}
          {selectedCourseItem.whatYouWillLearn && selectedCourseItem.whatYouWillLearn.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#F5EBE1] border border-[#D5C6B1] space-y-2.5">
              <div className="flex items-center gap-2 border-b border-[#E8DEC9] pb-2">
                <ClipboardList className="w-4 h-4 text-[#C89D3C]" />
                <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704] uppercase tracking-wider">
                  LO QUE APRENDERÁS EN ESTE CURSO
                </span>
              </div>
              <div className="space-y-2">
                {selectedCourseItem.whatYouWillLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C89D3C] shrink-0 mt-0.5" />
                    <span className="text-xs text-[#5D3704] leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with QUIERO APRENDER button */}
        <div className="pt-4 border-t border-[#E8DEC9] flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <span className="text-[11px] font-['Marcellus'] text-[#7A6655] text-center sm:text-left">
            Acceso inmediato y seguro a través de Hotmart.
          </span>

          <a
            href={selectedCourseItem.hotmartUrl || 'https://hotmart.com'}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-[#F5EBE1] hover:bg-[#ebdccf] border-2 border-[#D4AF37] text-[#5D3704] font-['Cinzel'] font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_22px_rgba(212,175,55,0.6)] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>QUIERO APRENDER</span>
            <ExternalLink className="w-4 h-4 text-[#8C6B1C]" />
          </a>
        </div>
      </div>
    </div>
  );
};
