import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import { CourseItem } from '../types';

export const CoursesSection: React.FC = () => {
  const { coursesList, openCourseModal } = useApp();
  const activeCourses = coursesList.filter((c) => c.active !== false);

  if (activeCourses.length === 0) {
    return (
      <div id="cursos" className="scroll-mt-24 rounded-3xl bg-white border border-[#E8DEC9] hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] p-5 sm:p-6 shadow-xs transition-all duration-300 flex flex-col justify-between">
        <div className="text-center">
          <div className="mb-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
              <span>ESPECIALIZACIONES & CURSOS</span>
              <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
            </h2>
            <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] mt-1 leading-relaxed text-center">
              Aprenderás todo lo que debes saber para ser una de las mejores en el rubro, especialízate hoy conmigo.
            </p>
          </div>
          <div className="py-8 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] text-[#7A6655] text-xs font-['Marcellus']">
            Próximamente cursos y especializaciones disponibles. 
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="cursos" className="scroll-mt-24 rounded-3xl bg-white border border-[#E8DEC9] hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] p-5 sm:p-6 shadow-xs transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
            <span>ESPECIALIZACIONES & CURSOS</span>
            <span className="text-xs sm:text-sm text-[#D4AF37] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] leading-none select-none">✦</span>
          </h2>

          <p className="text-xs sm:text-sm font-['Marcellus'] text-[#5D3704] mt-1 leading-relaxed text-center">
            Aprenderás todo lo que debes saber para ser una de las mejores en el rubro, especialízate hoy conmigo.
          </p>
        </div>

        {/* Horizontal List of Courses */}
        <div className="space-y-3">
          {activeCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => openCourseModal(course)}
              className="group p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC8] hover:border-[#D4AF37] hover:shadow-md hover:bg-[#FFFDF9] transition-all duration-300 flex items-center gap-3.5 cursor-pointer"
            >
              {/* Left Thumbnail */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#DDD1BF] bg-[#F0E6D8] shrink-0 shadow-2xs">
                <img
                  src={course.image || '/src/assets/images/nail_chrome_cateye_1792392507727.jpg'}
                  alt={course.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/src/assets/images/nail_chrome_cateye_1792392507727.jpg';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Center Title & Price */}
              <div className="flex-1 min-w-0">
                <h4 className="font-['Cinzel'] font-bold text-xs sm:text-sm text-[#5D3704] group-hover:text-[#8C6B1C] transition-colors line-clamp-2 leading-snug">
                  {course.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-[#8C6B1C]">
                    {course.priceLabel || `S/. ${course.price.toFixed(2)}`}
                  </span>
                  <span className="text-[10px] font-['Cinzel'] text-[#7A6655] bg-[#EFE7DC] px-2 py-0.5 rounded-md">
                    Ver Temario
                  </span>
                </div>
              </div>

              {/* Right Arrow */}
              <div className="w-9 h-9 rounded-full bg-[#F5EBE1] border border-[#D5C6B1] flex items-center justify-center text-[#5D3704] group-hover:bg-[#D4AF37] group-hover:text-white group-hover:border-[#D4AF37] transition-all shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
