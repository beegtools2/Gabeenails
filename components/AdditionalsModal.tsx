import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ADDITIONALS_DATA, AdditionalItem } from '../data/additionalsData';
import { GabeeBeeMark } from './GabeeBeeMark';
import { X, Sparkles, Check, Plus, Trash2, Calendar, ShoppingBag } from 'lucide-react';

export const AdditionalsModal: React.FC = () => {
  const {
    showAdditionalsModal,
    setShowAdditionalsModal,
    selectedAdditionals,
    toggleAdditional,
    clearAdditionals,
    additionalsTotal,
    additionalsList,
    openBooking,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('todos');

  if (!showAdditionalsModal) return null;

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'spa', label: 'Spa de Uñas' },
    { id: 'mantenimiento', label: 'Mantenimiento & Retiros' },
    { id: 'disenos', label: 'Diseños con Sistema' },
    { id: 'tamano', label: 'Largo & Formas' },
    { id: 'nailart', label: 'Nail Art & Efectos' },
  ];

  const filteredItems = additionalsList.filter((item) => {
    if (item.active === false) return false;
    const isForServicios = !item.targetSection || item.targetSection === 'servicios' || item.targetSection === 'both';
    if (!isForServicios) return false;
    if (activeTab === 'todos') return true;
    if (activeTab === 'tamano') return item.category === 'tamano' || item.category === 'formas';
    return item.category === activeTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FAF7F2] border border-[#E3D6C3] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-[#E8DEC9] flex items-center justify-between"
          style={{
            backgroundColor: '#FAF7F2',
            backgroundImage: 'var(--site-window-pattern)',
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-3.5">
            <GabeeBeeMark size="sm" />
            <div>
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#947D68] block">
                Catálogo de Complementos · Gabee Studio
              </span>
              <h3 className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] leading-tight">
                Servicios y Diseños Adicionales
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAdditionalsModal(false)}
            className="p-2 text-[#5D3704] hover:bg-[#EAE0D0] rounded-full transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-[#ECE2D2] bg-white flex gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-['Cinzel'] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === cat.id
                  ? 'bg-[#5D3704] text-[#FAF7F2] shadow-xs'
                  : 'bg-[#F5EBE1] text-[#5D3704] hover:bg-[#ebdccf]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
          <div className="p-3 rounded-xl bg-[#F5EFE6] border border-[#DECDB8] flex items-center justify-between text-[#5D3704]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A87B20] shrink-0" />
              <span className="font-['Marcellus'] text-xs">
                Selecciona los adicionales deseados para sumarlos de forma dinámica al valor de tu cita.
              </span>
            </div>
            {selectedAdditionals.length > 0 && (
              <button
                type="button"
                onClick={clearAdditionals}
                className="text-[11px] font-['Cinzel'] font-bold text-[#A84B30] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedAdditionals.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleAdditional(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#F5EBE1] border-[#5D3704] shadow-sm ring-1 ring-[#5D3704]'
                      : 'bg-white border-[#E9DFCE] hover:border-[#D8C7B0] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-['Cinzel'] font-bold text-xs text-[#5D3704]">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-['Cinzel'] font-bold uppercase tracking-wider bg-[#5D3704] text-[#FAF7F2] px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-['Marcellus'] text-[11px] text-[#7A614A] leading-relaxed mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-mono font-bold text-xs text-[#5D3704]">
                        S/. {item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EDE4D6] flex items-center justify-between text-[11px]">
                    <span />
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-xs font-['Cinzel'] font-bold flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-[#5D3704] text-[#FAF7F2]'
                          : 'bg-[#F5EBE1] text-[#5D3704] hover:bg-[#ebdccf]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 text-[#E6C665]" />
                          <span>Agregado</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 text-[#5D3704]" />
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer sticky bar with subtotal */}
        <div
          className="p-4 border-t border-[#E8DEC9] flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            backgroundColor: '#FAF7F2',
            backgroundImage: 'var(--site-window-pattern)',
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F5EBE1] border border-[#5D3704]/20 flex items-center justify-center text-[#5D3704]">
              <ShoppingBag className="w-5 h-5 text-[#5D3704]" />
            </div>
            <div>
              <span className="text-[11px] font-['Cinzel'] font-bold text-[#7A624E] block">
                {selectedAdditionals.length}{' '}
                {selectedAdditionals.length === 1 ? 'adicional seleccionado' : 'adicionales seleccionados'}
              </span>
              <span className="text-base font-bold font-mono text-[#5D3704]">
                Subtotal Adicionales: S/. {additionalsTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowAdditionalsModal(false)}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-[#D5C6B1] bg-[#F5EBE1] text-xs font-['Cinzel'] font-bold text-[#5D3704] hover:bg-[#ebdccf] cursor-pointer"
            >
              Listo / Volver
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdditionalsModal(false);
                openBooking('promotion');
              }}
              className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-xs hover:bg-[#ebdccf] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#5D3704]" />
              <span>Agendar Cita con Adicionales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
