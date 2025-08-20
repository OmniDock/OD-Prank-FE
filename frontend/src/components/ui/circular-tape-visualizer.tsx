import { useEffect, useRef } from "react";
import { getOrCreateAnalyser } from "@/components/ui/audio-graph";

interface CircularTapeVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isActive?: boolean;
  className?: string;
  size?: number;
  color?: string;
  glowColor?: string;
}

export function CircularTapeVisualizer({
  audioRef,
  isActive = true,
  className,
  size = 240,
  color = "#ff7a00",
  glowColor = "#ffb566",
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

      // Write new amplitude to current head position (amplified) only when active
      if (isActive) {
        waveHistory[headPositionRef.current] = currentAmp * 5.0;
      }
      
      // Advance head clockwise only when active
      if (isActive) {
        headPositionRef.current = (headPositionRef.current + 0.5) % 360;
      }

      // Update pulse phase for breathing effect (only when playing)
      const hasAudio = isActive && currentAmp > 0.001;
      if (hasAudio) {
        pulsePhaseRef.current += 0.04; // Slower, more gentle pulse
      }

      // Decay old values slightly for smooth trails
      for (let i = 0; i < 360; i++) {
        if (i !== headPositionRef.current) {
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
      const baseRadius = Math.min(w, h) * 0.28 * pulseAmount; // Smaller base circle
      const maxOffset = Math.min(w, h) * 0.35; // Bigger amplitude range

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
        const amplitude = waveHistory[i];
        const offset = amplitude * maxOffset;
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
        const amplitude = waveHistory[i];
        const offset = amplitude * maxOffset;
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
        const amplitude = waveHistory[i];
        const offset = amplitude * maxOffset;
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
      const headAngle = (headPositionRef.current * Math.PI) / 180 - Math.PI / 2;
      const headAmp = waveHistory[headPositionRef.current];
      const headR = baseRadius + headAmp * maxOffset;
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
    <div className={className} style={{ height: size, width: "100%" }}>
      <div className="flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          className="max-w-full" 
          style={{ height: size, width: size }} 
        />
      </div>
    </div>
  );
}

export default CircularTapeVisualizer;


