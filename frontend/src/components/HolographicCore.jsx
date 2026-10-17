import { useEffect, useRef } from 'react';
import { playBlip } from '../lib/audioSoundFx';

/**
 * HolographicCore — Ethereal, aesthetic, living AI orb (Siri / OpenAI voice inspired).
 * Pure fluid light, organic breathing, and real-time audio reactivity without clutter.
 */
export function HolographicCore({
  isRecording,
  isSpeaking,
  isLoading,
  audioLevel = 0,
  analyserRef,
  onCoreClick,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const mode = isRecording
    ? 'listening'
    : isLoading
    ? 'thinking'
    : isSpeaking
    ? 'speaking'
    : 'idle';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);

    // Ethereal floating light motes
    const particles = Array.from({ length: 36 }, () => ({
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 160,
      radius: Math.random() * 2 + 1,
      speed: 0.008 + Math.random() * 0.015,
      angle: Math.random() * Math.PI * 2,
      opacity: 0.2 + Math.random() * 0.6,
    }));

    let phase = 0;
    const freqData = new Uint8Array(32);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.26;

      let audioAmp = audioLevel || 0;
      if (analyserRef?.current && isRecording) {
        analyserRef.current.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < 16; i++) sum += freqData[i];
        audioAmp = Math.max(audioAmp, sum / (16 * 255));
      } else if (isSpeaking) {
        audioAmp = 0.35 + Math.sin(phase * 3) * 0.2;
      }

      phase += mode === 'thinking' ? 0.06 : mode === 'listening' ? 0.04 : 0.02;

      // ── Outer Soft Ethereal Aura ──
      const auraRadius = baseRadius * (1.6 + (mode === 'listening' ? audioAmp * 0.5 : 0.15));
      const aura = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, auraRadius);

      if (mode === 'listening') {
        aura.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        aura.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)');
        aura.addColorStop(1, 'rgba(8, 8, 13, 0)');
      } else if (mode === 'thinking') {
        aura.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        aura.addColorStop(0.5, 'rgba(236, 72, 153, 0.12)');
        aura.addColorStop(1, 'rgba(8, 8, 13, 0)');
      } else if (mode === 'speaking') {
        aura.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
        aura.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
        aura.addColorStop(1, 'rgba(8, 8, 13, 0)');
      } else {
        // Idle: Soft cosmic indigo/violet
        aura.addColorStop(0, 'rgba(124, 92, 252, 0.22)');
        aura.addColorStop(0.5, 'rgba(139, 92, 246, 0.06)');
        aura.addColorStop(1, 'rgba(8, 8, 13, 0)');
      }

      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── Concentric Minimalist Ripple Rings ──
      const ringCount = 3;
      for (let r = 1; r <= ringCount; r++) {
        const ringDist = baseRadius * (0.95 + r * 0.22 + Math.sin(phase + r) * 0.03);
        ctx.beginPath();
        ctx.arc(cx, cy, ringDist, 0, Math.PI * 2);
        ctx.strokeStyle =
          mode === 'listening'
            ? `rgba(56, 189, 248, ${0.12 / r})`
            : mode === 'speaking'
            ? `rgba(52, 211, 153, ${0.12 / r})`
            : mode === 'thinking'
            ? `rgba(192, 132, 252, ${0.12 / r})`
            : `rgba(255, 255, 255, ${0.05 / r})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // ── Fluid Organic Plasma Sphere (Multi-gradient mesh) ──
      const pulse = Math.sin(phase * 1.5) * 5;
      const coreR = baseRadius * 0.72 + pulse + (mode === 'listening' ? audioAmp * 22 : 0);

      const sphereGrad = ctx.createRadialGradient(
        cx - coreR * 0.28,
        cy - coreR * 0.28,
        coreR * 0.1,
        cx,
        cy,
        coreR
      );

      if (mode === 'listening') {
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.25, '#38bdf8');
        sphereGrad.addColorStop(0.65, '#0284c7');
        sphereGrad.addColorStop(1, '#0f172a');
      } else if (mode === 'thinking') {
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.25, '#f472b6');
        sphereGrad.addColorStop(0.65, '#8b5cf6');
        sphereGrad.addColorStop(1, '#1e1b4b');
      } else if (mode === 'speaking') {
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.25, '#34d399');
        sphereGrad.addColorStop(0.65, '#059669');
        sphereGrad.addColorStop(1, '#064e3b');
      } else {
        // Idle: Deep aesthetic purple/blue
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.25, '#c084fc');
        sphereGrad.addColorStop(0.65, '#6366f1');
        sphereGrad.addColorStop(1, '#0f0f1c');
      }

      ctx.save();
      ctx.shadowColor =
        mode === 'listening'
          ? '#38bdf8'
          : mode === 'speaking'
          ? '#34d399'
          : mode === 'thinking'
          ? '#f472b6'
          : '#7c5cfc';
      ctx.shadowBlur = 32 + (mode === 'listening' ? audioAmp * 24 : 0);

      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();
      ctx.restore();

      // ── Floating Light Particles ──
      particles.forEach((p) => {
        p.angle += p.speed * (mode === 'thinking' ? 2.5 : 1);
        const dist = baseRadius * 0.85 + Math.sin(phase + p.angle) * 20;
        const px = cx + Math.cos(p.angle) * dist;
        const py = cy + Math.sin(p.angle) * dist;

        ctx.fillStyle =
          mode === 'listening'
            ? `rgba(56, 189, 248, ${p.opacity})`
            : mode === 'speaking'
            ? `rgba(52, 211, 153, ${p.opacity})`
            : `rgba(255, 255, 255, ${p.opacity * 0.6})`;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mode, isRecording, isSpeaking, isLoading, audioLevel, analyserRef]);

  const handleCoreClick = () => {
    playBlip();
    if (onCoreClick) onCoreClick();
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-4">
      {/* Clean Interactive Living Orb */}
      <div
        onClick={handleCoreClick}
        className="cursor-pointer group relative w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center transition-all duration-300 active:scale-95"
        title={isRecording ? 'Tap to finish speaking' : 'Tap to speak'}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Minimalist Micro Mic Icon Overlay on Hover */}
        <div
          className={`absolute flex flex-col items-center justify-center pointer-events-none transition-all duration-300 ${
            mode === 'idle'
              ? 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
              : 'opacity-0'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Elegant Minimalist State Badge */}
      <div className="flex items-center gap-2 mt-3">
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            mode === 'listening'
              ? 'bg-sky-400 animate-pulse'
              : mode === 'thinking'
              ? 'bg-purple-400 animate-pulse'
              : mode === 'speaking'
              ? 'bg-emerald-400 animate-pulse'
              : 'bg-white/40'
          }`}
        />
        <span className="text-xs font-normal tracking-wide text-white/70">
          {mode === 'listening'
            ? 'Listening...'
            : mode === 'thinking'
            ? 'Thinking...'
            : mode === 'speaking'
            ? 'Nova speaking...'
            : 'Tap orb or speak'}
        </span>
      </div>
    </div>
  );
}
