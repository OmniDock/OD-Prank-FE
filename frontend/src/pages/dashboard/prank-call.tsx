import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

type StartCallResponse = {
  call_control_id: string;
  call_leg_id?: string;
  call_session_id?: string;
  media_ws_url?: string;
};

export default function PrankCall() {
  const [toNumber, setToNumber] = useState("+4915226152501");
  const [scenarioId] = useState<number>(1);
  const [loading, setLoading] = useState<"idle" | "preloading" | "dialing">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartCallResponse | null>(null);
  const [audioStats, setAudioStats] = useState({ inbound: 0, outbound: 0 });
  
  // Audio context and playback management
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const outboundQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const inboundQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const outboundNextTimeRef = useRef<number>(0);
  const inboundNextTimeRef = useRef<number>(0);

  const backendBase: string = (import.meta.env.VITE_BACKEND_URL as string) || "";
  const wsBase = backendBase.replace(/https:\/\//, "wss://").replace(/http:\/\//, "ws://").replace(/\/$/, "");

  function base64ToBytes(b64: string) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // Proper μ-law to PCM16 decoder
  function muLawToPCM16(u8: Uint8Array) {
    const BIAS = 0x84;
    const CLIP = 32635;
    const out = new Int16Array(u8.length);
    
    for (let i = 0; i < u8.length; i++) {
      let byte = ~u8[i];
      let sign = (byte & 0x80) >> 7;
      let exponent = (byte >> 4) & 0x07;
      let mantissa = byte & 0x0F;
      let sample = mantissa << (exponent + 3) | (1 << (exponent + 2));
      sample = sign ? (BIAS - sample) : (sample - BIAS);
      out[i] = sample > CLIP ? CLIP : sample < -CLIP ? -CLIP : sample;
    }
    return out;
  }

  async function initAudioContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      // Resume context if suspended (browser autoplay policy)
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      outboundNextTimeRef.current = 0;
      inboundNextTimeRef.current = 0;
    }
    return audioCtxRef.current;
  }

  async function playAudioChunk(
    pcm16: Int16Array, 
    direction: "inbound" | "outbound",
    sampleRate: number = 8000
  ) {
    const ctx = await initAudioContext();
    
    // Choose the right timing reference
    const nextTimeRef = direction === "outbound" ? outboundNextTimeRef : inboundNextTimeRef;
    
    // Resample to browser's native rate for better quality
    const targetRate = ctx.sampleRate;
    const resampleRatio = targetRate / sampleRate;
    const targetLength = Math.floor(pcm16.length * resampleRatio);
    
    // Create buffer
    const buffer = ctx.createBuffer(1, targetLength, targetRate);
    const channel = buffer.getChannelData(0);
    
    // Linear interpolation resampling
    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = i / resampleRatio;
      const index0 = Math.floor(sourceIndex);
      const index1 = Math.min(index0 + 1, pcm16.length - 1);
      const fraction = sourceIndex - index0;
      
      const sample0 = pcm16[index0] / 32768;
      const sample1 = pcm16[index1] / 32768;
      channel[i] = sample0 + (sample1 - sample0) * fraction;
    }
    
    // Create and schedule source
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Add gain control for each direction
    const gainNode = ctx.createGain();
    gainNode.gain.value = direction === "outbound" ? 0.7 : 1.0; // Slightly lower outbound volume
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Schedule playback
    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime + 0.01, nextTimeRef.current); // Small buffer
    source.start(startTime);
    
    // Update next start time
    nextTimeRef.current = startTime + buffer.duration;
    
    // Track queue
    if (direction === "outbound") {
      outboundQueueRef.current.push(source);
    } else {
      inboundQueueRef.current.push(source);
    }
    
    // Clean up old sources
    source.onended = () => {
      const queue = direction === "outbound" ? outboundQueueRef : inboundQueueRef;
      const idx = queue.current.indexOf(source);
      if (idx > -1) queue.current.splice(idx, 1);
    };
  }

  useEffect(() => {
    if (!result?.call_control_id) return;
    
    const url = `${wsBase}/telnyx/monitor/${encodeURIComponent(result.call_control_id)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log("Monitor WebSocket connected");
      setAudioStats({ inbound: 0, outbound: 0 });
    };
    
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        
        if (msg?.event === "media" && msg?.codec === "PCMU" && msg?.payload) {
          const direction = msg.direction as "inbound" | "outbound";
          const ulaw = base64ToBytes(msg.payload);
          const pcm16 = muLawToPCM16(ulaw);
          
          // Play audio from both directions
          await playAudioChunk(pcm16, direction, msg.rate || 8000);
          
          // Update stats
          setAudioStats(prev => ({
            ...prev,
            [direction]: prev[direction] + 1
          }));
        }
      } catch (err) {
        console.error("Error processing audio:", err);
      }
    };
    
    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    
    ws.onclose = () => {
      console.log("Monitor WebSocket closed");
      wsRef.current = null;
    };
    
    return () => {
      // Clean up
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      
      // Stop all playing audio
      [...outboundQueueRef.current, ...inboundQueueRef.current].forEach(source => {
        try { source.stop(); } catch {}
      });
      outboundQueueRef.current = [];
      inboundQueueRef.current = [];
      
      // Reset timing
      outboundNextTimeRef.current = 0;
      inboundNextTimeRef.current = 0;
    };
  }, [result?.call_control_id]);

  async function preloadAudio() {
    setError(null);
    setResult(null);
    setLoading("preloading");
    try {
      const res = await apiFetch(
        `/audio-preload/scenarios/${scenarioId}/preload`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(await res.text());
      setLoading("idle");
    } catch (e: any) {
      setError(e?.message || "Preload failed");
      setLoading("idle");
    }
  }

  async function startCall() {
    setError(null);
    setResult(null);
    setLoading("dialing");
    try {
      const res = await apiFetch(`/telnyx/call`, {
        method: "POST",
        body: JSON.stringify({
          to_number: toNumber,
          scenario_id: scenarioId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: StartCallResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Call failed");
    } finally {
      setLoading("idle");
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        Prank Call
      </h2>

      <label style={{ display: "block", marginBottom: 6 }}>
        To number (E.164)
      </label>
      <input
        value={toNumber}
        onChange={(e) => setToNumber(e.target.value)}
        placeholder="+4915226152501"
        style={{
          width: "100%",
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
        Scenario ID: <strong>{scenarioId}</strong>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={preloadAudio}
          disabled={loading !== "idle"}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: loading === "preloading" ? "#eee" : "#f6f6f6",
            cursor: loading !== "idle" ? "not-allowed" : "pointer",
          }}
        >
          {loading === "preloading" ? "Preloading…" : "Preload audio"}
        </button>

        <button
          onClick={startCall}
          disabled={loading !== "idle"}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #0b5",
            background: loading === "dialing" ? "#0b5" : "#0c6",
            color: "#fff",
            cursor: loading !== "idle" ? "not-allowed" : "pointer",
          }}
        >
          {loading === "dialing" ? "Calling…" : "Start call"}
        </button>
      </div>

      {error && (
        <div style={{ color: "#b00", whiteSpace: "pre-wrap" }}>{error}</div>
      )}

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f8f8f8",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          <div>call_control_id: {result.call_control_id}</div>
          {result.call_leg_id && <div>call_leg_id: {result.call_leg_id}</div>}
          {result.call_session_id && (
            <div>call_session_id: {result.call_session_id}</div>
          )}
          <div style={{ marginTop: 8, color: "#666" }}>
            <div>📞 Call active - Playing bidirectional audio</div>
            <div>🔊 Outbound chunks: {audioStats.outbound}</div>
            <div>🎤 Inbound chunks: {audioStats.inbound}</div>
          </div>
        </div>
      )}
    </div>
  );
}