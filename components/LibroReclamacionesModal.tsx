import React, { useState } from 'react';
import { X, BookOpen, Send, CheckCircle2, AlertCircle, Paperclip, Loader2 } from 'lucide-react';
import { GabeeBeeMark } from './GabeeBeeMark';

interface LibroReclamacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EvidenceAttachment {
  filename: string;
  contentType: string;
  content: string;
  preview: string;
}

export const LibroReclamacionesModal: React.FC<LibroReclamacionesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [consumerName, setConsumerName] = useState('');
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [claimType, setClaimType] = useState<'queja' | 'reclamo'>('reclamo');
  const [serviceContracted, setServiceContracted] = useState('Servicio de Manicura / Uñas');
  const [amount, setAmount] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [detail, setDetail] = useState('');
  const [order, setOrder] = useState('');
  const [evidence, setEvidence] = useState<EvidenceAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (
      !consumerName.trim() ||
      !docNumber.trim() ||
      !email.trim() ||
      !serviceCode.trim() ||
      !detail.trim()
    ) {
      setSubmitError('Por favor completa todos los campos requeridos (*).');
      return;
    }

    const year = new Date().getFullYear().toString().slice(-2);
    const code = `REC${year}_${Math.floor(1000 + Math.random() * 9000)}`;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/libro-reclamaciones/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          consumerName,
          docType,
          docNumber,
          email,
          phone,
          address,
          claimType,
          serviceContracted,
          serviceCode,
          amount,
          detail,
          order,
          attachments: evidence.map(({ filename, contentType, content }) => ({
            filename,
            contentType,
            content,
          })),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo enviar la constancia. Inténtalo nuevamente.');
      }
      setSubmittedCode(code);
    } catch (err: any) {
      setSubmitError(err?.message || 'No se pudo enviar la constancia. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvidenceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const available = Math.max(0, 5 - evidence.length);
    if (!available) {
      setSubmitError('Puedes adjuntar hasta 5 imágenes como máximo.');
      return;
    }

    const selected = files.slice(0, available);
    const tooBig = selected.find((file) => file.size > 4 * 1024 * 1024);
    if (tooBig) {
      setSubmitError(`"${tooBig.name}" supera el tamaño máximo de 4 MB.`);
      return;
    }
    if (files.length > available) {
      setSubmitError(`Solo se permiten hasta 5 imágenes. Se agregaron ${available}.`);
    }

    const converted = await Promise.all(
      selected.map(
        (file) =>
          new Promise<EvidenceAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const preview = String(reader.result || '');
              resolve({
                filename: file.name,
                contentType: file.type || 'image/jpeg',
                content: preview.includes(',') ? preview.split(',')[1] : preview,
                preview,
              });
            };
            reader.onerror = () => reject(new Error(`No se pudo leer "${file.name}".`));
            reader.readAsDataURL(file);
          })
      )
    );
    setEvidence((prev) => [...prev, ...converted]);
  };

  const removeEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setSubmittedCode(null);
    setConsumerName('');
    setDocType('DNI');
    setDocNumber('');
    setEmail('');
    setPhone('');
    setAddress('');
    setClaimType('reclamo');
    setServiceContracted('Servicio de Manicura / Uñas');
    setAmount('');
    setServiceCode('');
    setDetail('');
    setOrder('');
    setEvidence([]);
    setSubmitError(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative border border-[#5D3704]/20 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          backgroundImage: 'var(--site-window-pattern)',
          backgroundSize: '240px auto',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-md pointer-events-none" />

        {/* Header (Franja superior con patrón de abejas, igual que el modal de agendamiento) */}
        <div
          className="relative z-10 p-5 sm:p-6 border-b border-[#5D3704]/15 flex items-center justify-between gap-4"
          style={{
            backgroundColor: '#FAF7F2',
            backgroundImage: 'var(--site-window-pattern)',
            backgroundSize: '200px auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="flex items-center gap-3 bg-[#FAF7F2]/90 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-[#5D3704]/20">
            <GabeeBeeMark size="sm" />
            <div>
              <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]/90 block">
                Conforme a la Ley N° 29571 · INDECOPI
              </span>
              <h2 className="text-xl sm:text-2xl font-['Cinzel'] font-bold text-[#5D3704] tracking-tight">
                Libro de Reclamaciones Virtual
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            aria-label="Cerrar modal"
            className="p-2 text-[#5D3704] bg-[#F5EBE1] hover:bg-[#ebdccf] rounded-full shadow-2xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-[#5D3704]" />
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-[#5D3704] flex-1">
          {submittedCode ? (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#F5EBE1] border border-[#5D3704]/30 flex items-center justify-center text-[#5D3704] mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9 text-[#5D3704]" />
              </div>

              <div>
                <span className="text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest text-[#5D3704]/80 block">
                  Hoja de Reclamación Registrada
                </span>
                <h3 className="text-2xl font-['Cinzel'] font-bold text-[#5D3704] mt-1">
                  Código: {submittedCode}
                </h3>
                <p className="text-[11px] font-['Cinzel'] font-bold uppercase tracking-wider text-[#8C6B1C] mt-1">
                  Código de servicio: {serviceCode}
                </p>
                <p className="text-xs font-['Marcellus'] text-[#5D3704] max-w-md mx-auto mt-2 leading-relaxed">
                  Tu solicitud ha sido ingresada en el Libro de Reclamaciones de <strong>BEETOOLS E.I.R.L. (RUC: 20614757257)</strong>. Conforme a la Ley N° 29571, el plazo máximo legal es de hasta 15 días hábiles; sin embargo, haremos todo lo posible por contactarnos antes contigo, por eso debes estar atenta a tu correo.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-6 rounded-xl bg-[#F5EBE1] border border-[#5D3704]/40 hover:bg-[#ebdccf] text-xs font-['Cinzel'] font-bold text-[#5D3704] shadow-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#C0392B]/40 flex items-start gap-2 text-xs font-['Marcellus'] text-[#8E2E22] animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{submitError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#F5EBE1] border border-[#5D3704]/20 flex items-start gap-2.5 text-xs font-['Marcellus'] text-[#5D3704]">
                <AlertCircle className="w-4 h-4 text-[#5D3704] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Razón Social:</strong> BEETOOLS E.I.R.L. · <strong>RUC:</strong> 20614757257 · <strong>Dirección:</strong> Lima, Perú · <strong>Email:</strong> beeg.tools@gmail.com
                </p>
              </div>

              {/* Tipo de Registro */}
              <div>
                <label className="block text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] mb-1.5">
                  Tipo de Requerimiento *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      claimType === 'reclamo'
                        ? 'border-[#5D3704] bg-[#F5EBE1] font-bold text-[#5D3704]'
                        : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="claimType"
                      checked={claimType === 'reclamo'}
                      onChange={() => setClaimType('reclamo')}
                      className="accent-[#5D3704]"
                    />
                    <div>
                      <span className="font-['Cinzel'] font-bold text-xs block">Reclamo</span>
                      <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/70">
                        Disconformidad sobre el servicio o producto
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      claimType === 'queja'
                        ? 'border-[#5D3704] bg-[#F5EBE1] font-bold text-[#5D3704]'
                        : 'border-[#5D3704]/20 bg-white/70 text-[#5D3704]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="claimType"
                      checked={claimType === 'queja'}
                      onChange={() => setClaimType('queja')}
                      className="accent-[#5D3704]"
                    />
                    <div>
                      <span className="font-['Cinzel'] font-bold text-xs block">Queja</span>
                      <span className="text-[10px] font-['Marcellus'] text-[#5D3704]/70">
                        Disconformidad con la atención al cliente
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Datos del Consumidor */}
              <div className="space-y-3">
                <span className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block border-b border-[#5D3704]/15 pb-1">
                  1. Identificación del Consumidor Reclamante
                </span>

                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={consumerName}
                    onChange={(e) => setConsumerName(e.target.value)}
                    placeholder="Ej: Lucía Morales"
                    className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Documento de Identidad *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="px-2 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Cinzel'] text-[#5D3704]"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CE">C.E.</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="Número de documento"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-mono text-[#5D3704]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-mono text-[#5D3704]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Domicilio en Lima
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Dirección, Distrito"
                      className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704]"
                    />
                  </div>
                </div>
              </div>

              {/* Detalle del Reclamo */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-['Cinzel'] font-bold uppercase tracking-wider text-[#5D3704] block border-b border-[#5D3704]/15 pb-1">
                  2. Detalle de la Reclamación y Pedido
                </span>

                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Código de Servicio / Pedido / Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceCode}
                    onChange={(e) => setServiceCode(e.target.value)}
                    placeholder="Ej: PED-2026-0142"
                    className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-mono text-[#5D3704]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Servicio Contratado
                    </label>
                    <input
                      type="text"
                      value={serviceContracted}
                      onChange={(e) => setServiceContracted(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                      Monto Reclamado (S/.)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Ej: 80.00"
                      className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-mono text-[#5D3704]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Detalle del Reclamo o Queja *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Describe los hechos ocurridos de forma clara y detallada..."
                    className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Pedido Concreto del Consumidor
                  </label>
                  <textarea
                    rows={2}
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="Ej: Reembolso, reprogramación, rectificación de servicio..."
                    className="w-full px-3 py-2 rounded-xl border border-[#5D3704]/30 bg-white/80 text-xs font-['Marcellus'] text-[#5D3704]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-['Cinzel'] font-bold text-[#5D3704] mb-1">
                    Adjuntar fotos / evidencias (Opcional)
                  </label>
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-[#5D3704]/40 bg-white/80 hover:bg-[#F5EBE1] text-xs font-['Marcellus'] text-[#5D3704] cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <span>Seleccionar imágenes (máx. 5 · 4 MB c/u)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEvidenceChange}
                      className="hidden"
                    />
                  </label>
                  {evidence.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {evidence.map((item, index) => (
                        <div key={`${item.filename}-${index}`} className="relative group">
                          <img
                            src={item.preview}
                            alt={item.filename}
                            className="w-14 h-14 object-cover rounded-lg border border-[#5D3704]/30"
                          />
                          <button
                            type="button"
                            onClick={() => removeEvidence(index)}
                            title="Quitar imagen"
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#5D3704] text-[#FAF7F2] flex items-center justify-center shadow-xs hover:bg-[#472a03] cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-4 rounded-xl border border-[#5D3704]/30 bg-[#F5EBE1] text-xs font-['Cinzel'] font-bold text-[#5D3704] hover:bg-[#ebdccf] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`py-2.5 px-6 rounded-xl bg-[#FAF5EB] border border-[#D4AF37]/80 text-[#5D3704] text-xs font-['Cinzel'] font-bold shadow-xs flex items-center gap-2 transition-all ${
                    isSubmitting
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:bg-[#F5E7C8] hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.28)] cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Reclamación'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
