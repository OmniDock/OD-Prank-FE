import { useEffect, useRef } from "react";
import { getOrCreateAnalyser } from "@/components/ui/audio-graph";

interface CircularTapeVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isActive?: boolean;
  className?: string;
  size?: number;
  color?: string;
  glowColor?: string;
  padding?: number; // extra inner spacing between circle and canvas edge (in CSS px)
}

export function CircularTapeVisualizer({
  audioRef,
  isActive = true,
  className,
  size = 240,
  color = "#ff7a00",
  glowColor = "#ffb566",
  padding = 0,
}: CircularTapeVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);
  const waveHistoryRef = useRef<Float32Array | null>(null);
  const headPositionRef = useRef<number>(0);
  const pulsePhaseRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const { analyser } = getOrCreateAnalyser(audio, { fftSize: 2048, smoothingTimeConstant: 0.8 });
    analyserRef.current = analyser;
    timeDataRef.current = new Uint8Array(analyser.fftSize);
    waveHistoryRef.current = new Float32Array(360).fill(0);
    headPositionRef.current = 0;
    pulsePhaseRef.current = 0;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      const analyserNode = analyserRef.current;
      const timeData = timeDataRef.current;
      const waveHistory = waveHistoryRef.current;
      if (!ctx || !analyserNode || !timeData || !waveHistory) return;

      // Get fresh time domain data
      analyserNode.getByteTimeDomainData(timeData);
      
      // Calculate current amplitude
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sum += v * v;
      }
      const currentAmp = Math.sqrt(sum / timeData.length);

      // Write new amplitude to current head position (amplified, normalized) only when active
      if (isActive) {
        const headIndex = Math.floor(headPositionRef.current);
        const gain = 5.2; // visual gain (30% increase)
        const normalized = Math.min(1, currentAmp * gain);
        waveHistory[headIndex] = normalized;
      }
      
      // Advance head clockwise only when active
      if (isActive) {
        headPositionRef.current = (headPositionRef.current + 0.45) % 360; // 1.25x slower vs 0.25
      }

      // Update pulse phase for breathing effect (only when playing)
      const hasAudio = isActive && currentAmp > 0.001;
      if (hasAudio) {
        pulsePhaseRef.current += 0.015; // slower pulse motion
      }

      // Decay old values slightly for smooth trails
      const activeHeadIndex = Math.floor(headPositionRef.current);
      for (let i = 0; i < 360; i++) {
        if (i !== activeHeadIndex) {
          waveHistory[i] *= 0.98;
        }
      }

      // Canvas setup
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      
      // Add gentle pulse effect when audio is playing
      const pulseAmount = hasAudio ? Math.sin(pulsePhaseRef.current) * 0.03 + 1 : 1;
      const minDim = Math.min(w, h);
      // Account for stroke widths and glow to keep drawing inside canvas
      const strokeMax = 8 * dpr; // outer stroke width
      const glowMax = 20 * dpr; // outer glow blur radius
      // Calculate margin based on max amplitude + glow + strokes
      // The 1.2 factor is to compensate for max amplitude expansion from waveform
      const margin = (strokeMax / 2 + glowMax + 2 * dpr) * 1.2 + (padding * dpr);
      const maxRadius = Math.max(0, minDim / 2 - margin);
      const baseRadius = Math.min(minDim * 0.252 * pulseAmount, maxRadius * 0.9); // 10% smaller base circle
      const availableOffset = Math.max(0, maxRadius - baseRadius);

      ctx.clearRect(0, 0, w, h);

      // Draw waveform with multiple glow layers for intense effect
      // Layer 1: Outer glow
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 8 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20 * dpr;
      ctx.globalAlpha = 0.3;
      
      ctx.beginPath();
      for (let i = 0; i < 360; i++) {
        const angle = (i * Math.PI) / 180 - Math.PI / 2;
        const amplitude = Math.min(1, waveHistory[i]);
        const offset = amplitude * availableOffset;
        const r = baseRadius + offset;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Layer 2: Middle glow
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 5 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12 * dpr;
      ctx.globalAlpha = 0.5;
      
      ctx.beginPath();
      for (let i = 0; i < 360; i++) {
        const angle = (i * Math.PI) / 180 - Math.PI / 2;
        const amplitude = Math.min(1, waveHistory[i]);
        const offset = amplitude * availableOffset;
        const r = baseRadius + offset;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Layer 3: Main stroke
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8 * dpr;
      
      ctx.beginPath();
      for (let i = 0; i < 360; i++) {
        const angle = (i * Math.PI) / 180 - Math.PI / 2;
        const amplitude = Math.min(1, waveHistory[i]);
        const offset = amplitude * availableOffset;
        const r = baseRadius + offset;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Draw subtle base circle for reference with pulse glow
      ctx.save();
      if (hasAudio) {
        const glowIntensity = Math.sin(pulsePhaseRef.current) * 0.3 + 0.7;
        // Outer glow layer
        ctx.strokeStyle = `${glowColor}60`;
        ctx.lineWidth = 3 * dpr;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15 * dpr;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius / pulseAmount, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner line
        ctx.strokeStyle = `${color}${Math.floor(glowIntensity * 51).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1 * dpr;
        ctx.shadowBlur = 8 * dpr;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius / pulseAmount, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = `${color}20`;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius / pulseAmount, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Draw current head position indicator with layered glow
      const headIndex = Math.floor(headPositionRef.current);
      const headAngle = (headIndex * Math.PI) / 180 - Math.PI / 2;
      const headAmp = Math.min(1, waveHistory[headIndex]);
      const headR = baseRadius + headAmp * availableOffset;
      const headX = cx + Math.cos(headAngle) * headR;
      const headY = cy + Math.sin(headAngle) * headR;
      
      // Outer glow
      ctx.save();
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15 * dpr;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(headX, headY, 8 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Inner bright dot
      ctx.save();
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(headX, headY, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    // Always start the animation loop, but only update when active
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      try {
        if (analyserRef.current) analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    };
  }, [audioRef, isActive, color, glowColor, size]);

  return (
    <div className={className} style={{ height: size, width: size }}>
      <div className="flex items-center justify-center" style={{ height: size, width: size }}>
        <canvas
          ref={canvasRef}
          style={{ height: size, width: size }}
        />
      </div>
    </div>
  );
}

export default CircularTapeVisualizer;


