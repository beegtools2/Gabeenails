import React, { useState, useEffect, useMemo, useRef } from 'react';

interface PreloaderProps {
  onComplete?: () => void;
}

interface SparkleParticle {
  id: number;
  burstX: number;
  burstY: number;
  fallY: number;
  delay: number;
  life: number;
  size: number;
  color: string;
  isSvg: boolean;
  phase: number;
  spin: number;
  sway: number;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'flying' | 'centered' | 'fadeout' | 'done'>('flying');
  const [sparklesActive, setSparklesActive] = useState(false);
  const sparkleNodesRef = useRef<Array<HTMLDivElement | null>>([]);

  // Warm golden confetti particles: burst outwards, then drift and fall like confetti.
  const sparkleParticles: SparkleParticle[] = useMemo(() => {
    const list: SparkleParticle[] = [];
    const goldColors = ['#D4AF37', '#C89D3C', '#E5C158', '#FDE047', '#C5A059'];

    const makeParticle = (id: number, angle: number, isSvg: boolean): SparkleParticle => {
      const distance = 80 + Math.random() * 220;
      const rad = (angle * Math.PI) / 180;
      return {
        id,
        burstX: Math.round(Math.cos(rad) * distance),
        burstY: Math.round(Math.sin(rad) * 60) - 40,
        fallY: 180 + Math.round(Math.random() * 220),
        delay: Math.round(Math.random() * 320) / 1000,
        life: 1.3 + Math.round(Math.random() * 550) / 1000,
        size: 10 + Math.round(Math.random() * 12),
        color: goldColors[id % goldColors.length],
        isSvg,
        phase: Math.random() * Math.PI * 2,
        spin: (50 + Math.random() * 110) * (Math.random() > 0.5 ? 1 : -1),
        sway: 10 + Math.random() * 20,
      };
    };

    // Left cascade shower (13 particles)
    for (let i = 0; i < 13; i++) {
      list.push(makeParticle(i, 120 + Math.random() * 60, i % 2 === 0));
    }

    // Right cascade shower (13 particles)
    for (let i = 13; i < 26; i++) {
      list.push(makeParticle(i, 0 - Math.random() * 60, i % 2 === 1));
    }

    return list;
  }, []);

  useEffect(() => {
    // 1. Bee flies from top right to center (approx 0.95s)
    const timerArrive = setTimeout(() => {
      setStage('centered');
      setSparklesActive(true);
    }, 950);

    // 2. Start smooth fade-out after the cascade finishes (approx 2.6s)
    const timerFade = setTimeout(() => {
      setStage('fadeout');
    }, 2600);

    // 3. Complete removal from DOM
    const timerDone = setTimeout(() => {
      setStage('done');
      if (onComplete) onComplete();
    }, 3300);

    return () => {
      clearTimeout(timerArrive);
      clearTimeout(timerFade);
      clearTimeout(timerDone);
    };
  }, [onComplete]);

  // Continuous, frame-by-frame confetti motion (no keyframe jumps or pauses).
  useEffect(() => {
    if (!sparklesActive) return;

    let frameId = 0;
    let startTime: number | null = null;
    const maxLife = Math.max(...sparkleParticles.map((p) => p.delay + p.life));

    const animate = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;

      sparkleParticles.forEach((p, index) => {
        const node = sparkleNodesRef.current[index];
        if (!node) return;

        const t = elapsed - p.delay;
        if (t < 0 || t > p.life) {
          node.style.opacity = '0';
          node.style.visibility = 'hidden';
          return;
        }
        node.style.visibility = 'visible';

        const u = t / p.life;
        // Smooth outward burst (cubic ease-out), then a soft gravitational fall.
        const burst = 1 - Math.pow(1 - Math.min(1, t / 0.42), 3);
        const fallTime = Math.max(0, t - 0.34);
        const fallProgress = Math.min(1, fallTime / Math.max(0.1, p.life - 0.34));
        const fallEase = fallProgress * fallProgress;

        const sway = Math.sin(fallTime * 3.1 + p.phase) * p.sway * burst;
        const x = p.burstX * burst + p.burstX * 0.16 * fallProgress + sway;
        const y = p.burstY * burst + p.fallY * fallEase;

        const scale = (0.32 + 0.85 * burst) * (1 - 0.7 * Math.pow(u, 2.5));
        const rotation = p.spin * t;
        const opacity = Math.min(1, t / 0.12) * Math.min(1, (p.life - t) / 0.45);

        node.style.transform =
          `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
          `scale(${scale.toFixed(3)}) rotate(${rotation.toFixed(1)}deg)`;
        node.style.opacity = opacity.toFixed(3);
      });

      if (elapsed < maxLife + 0.1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [sparklesActive, sparkleParticles]);

  if (stage === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF7F2] transition-opacity duration-700 select-none ${
        stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft warm ivory background glow: radial gradient reaches full transparency
          long before the box edge, so no ring or circular rim is visible. */}
      <div
        className="absolute w-[520px] h-[520px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.07) 30%, rgba(212,175,55,0.025) 48%, rgba(250,247,242,0) 66%, rgba(250,247,242,0) 100%)',
        }}
      />

      {/* Main Central Presentation */}
      <div className="relative flex flex-col items-center justify-center z-10 px-4 text-center">

        {/* Bee Isotype Container - no clipping box, no hard edges */}
        <div className="relative flex items-center justify-center overflow-visible">

          {/* Animated Golden Bee (Flies from top-right to center, then hovers gently) */}
          <div
            className={`relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 ${
              stage === 'flying' ? 'animate-bee-fly-corporate' : 'animate-bee-hover'
            }`}
          >
            {/* Soft golden aura: radial gradient dissolves to the background color at 66%
                of the box, well before any edge, so the halo has no visible boundary. */}
            <div
              className="absolute -inset-10 pointer-events-none animate-pulse"
              style={{
                background:
                  'radial-gradient(circle, rgba(212,175,55,0.20) 0%, rgba(212,175,55,0.11) 28%, rgba(212,175,55,0.035) 46%, rgba(250,247,242,0) 66%, rgba(250,247,242,0) 100%)',
              }}
            />

            {/* BASE LAYER: Translucent outline/silhouette of the clean bee */}
            <img
              src="/assets/aistudio/Logo_Abejita_Sin_Circulo_Gold.png"
              alt="Gabee Studio - Isotipo Oficial Abejita"
              className="w-full h-full object-contain select-none opacity-20 filter contrast-125"
            />

            {/* FILLED LAYER: feathered gradient reveal (no clip-path / overflow cut),
                so the golden glow dissolves softly in every direction */}
            <div className="absolute inset-0 animate-bee-fill pointer-events-none overflow-visible">
              <img
                src="/assets/aistudio/Logo_Abejita_Sin_Circulo_Gold.png"
                alt="Gabee Studio - Isotipo Oficial Abejita Dorada"
                className="w-full h-full object-contain select-none drop-shadow-[0_0_20px_rgba(212,175,55,0.9)] filter brightness-105"
              />
            </div>
          </div>

          {/* Cascading Golden Sparkle Shower - smoothly animated via requestAnimationFrame */}
          {sparklesActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
              {sparkleParticles.map((p, index) => (
                <div
                  key={p.id}
                  ref={(el) => {
                    sparkleNodesRef.current[index] = el;
                  }}
                  className="absolute pointer-events-none"
                  style={{ opacity: 0, visibility: 'hidden', willChange: 'transform, opacity' }}
                >
                  {p.isSvg ? (
                    <svg
                      width={p.size}
                      height={p.size}
                      viewBox="0 0 24 24"
                      fill={p.color}
                      style={{ filter: `drop-shadow(0 0 6px ${p.color})` }}
                    >
                      <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
                    </svg>
                  ) : (
                    <span
                      className="font-bold select-none leading-none block"
                      style={{
                        fontSize: `${p.size}px`,
                        color: p.color,
                        textShadow: `0 0 8px ${p.color}, 0 0 14px rgba(212, 175, 55, 0.8)`,
                      }}
                    >
                      ✦
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loading Caption */}
        <div className="mt-7">
          <p
            className="font-['Cormorant_Garamond',serif] italic text-base sm:text-lg md:text-xl tracking-wide max-w-sm sm:max-w-md mx-auto leading-relaxed"
            style={{ color: '#5D3704' }}
          >
            La experiencia está por comenzar...
          </p>
        </div>

      </div>
    </div>
  );
};
