import { useEffect, useRef } from "react";

// Shared AudioContext and mapping to ensure each HTMLMediaElement is only ever
// wrapped by a single MediaElementSourceNode (required by Web Audio API)
let sharedAudioContext: (AudioContext | null) = null;
const elementSourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
const connectedToDestination = new WeakSet<MediaElementAudioSourceNode>();

interface VoiceVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isActive?: boolean;
  className?: string;
  height?: number;
  colors?: [string, string];
  lineWidth?: number;
  smoothing?: number; // 0..1
}

// Dual-wave canvas visualizer with mirrored colored lines and glow
export function VoiceVisualizer({
  audioRef,
  isActive = true,
  className,
  height = 140,
  colors = ["#22c55e", "#3b82f6"],
  lineWidth = 2,
  smoothing = 0.8,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let audioContext = sharedAudioContext;
    if (!audioContext) {
      const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContext = new Ctx();
      sharedAudioContext = audioContext;
    }

    let source = elementSourceMap.get(audio);
    if (!source) {
      // Create once per audio element for the lifetime of the AudioContext
      source = audioContext.createMediaElementSource(audio);
      elementSourceMap.set(audio, source);
    }

    let analyser = analyserRef.current;
    if (!analyser) {
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = smoothing;
      analyserRef.current = analyser;
    }

    // Connect source -> analyser and ensure a single connection to destination
    try {
      source.connect(analyser);
    } catch {
      // ignore if already connected
    }
    try {
      if (!connectedToDestination.has(source)) {
        source.connect(audioContext.destination);
        connectedToDestination.add(source);
      }
    } catch {
      // ignore if already connected
    }

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !analyser) return;
      analyser.getByteTimeDomainData(timeData);

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Compute a simple amplitude average to drive glow/scale
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = (timeData[i] - 128) / 128; // -1..1
        sum += Math.abs(v);
      }
      const avgAmp = sum / bufferLength; // 0..1

      // Background subtle gradient that breathes with amplitude
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "rgba(59,130,246,0.04)");
      bgGrad.addColorStop(1, "rgba(34,197,94,0.04)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Setup styles
      ctx.lineWidth = lineWidth * (1 + avgAmp * 0.8);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // Create a horizontal scale based on amplitude (slight vibration/stretch)
      const scaleX = 1 + avgAmp * 0.06;
      const offsetX = (w - w / scaleX) / 2;

      // Draw two mirrored waves with different colors
      const drawWave = (invert: 1 | -1, color: string) => {
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const t = i / (bufferLength - 1);
          const x = offsetX + (t * w) / scaleX;
          // Smooth waveform with easing to emphasize center
          const v = (timeData[i] - 128) / 128; // -1..1
          const ease = Math.sin(t * Math.PI);
          const y = centerY + invert * v * ease * (h * 0.35);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, "#a78bfa");
        grad.addColorStop(1, color);
        ctx.strokeStyle = grad;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 + avgAmp * 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawWave(1, colors[0]);
      drawWave(-1, colors[1]);

      // Add pulsing orb at center reacting to amplitude
      const orbRadius = 8 + avgAmp * 22;
      const orbGrad = ctx.createRadialGradient(w / 2, centerY, 0, w / 2, centerY, orbRadius * 2);
      orbGrad.addColorStop(0, "rgba(99,102,241,0.35)");
      orbGrad.addColorStop(1, "rgba(99,102,241,0)");
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(w / 2, centerY, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    if (isActive) {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      try {
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
      } catch {}
      // Keep sharedAudioContext and elementSourceMap for reuse across mounts
      analyserRef.current = null;
    };
  }, [audioRef, height, lineWidth, smoothing, colors, isActive]);

  return (
    <div className={className} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full rounded-md" />
    </div>
  );
}

export default VoiceVisualizer;


