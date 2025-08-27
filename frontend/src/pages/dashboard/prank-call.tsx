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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const backendBase: string = (import.meta.env.VITE_BACKEND_URL as string) || "";
  const wsBase = backendBase.replace(/https:\/\//, "wss://").replace(/http:\/\//, "ws://").replace(/\/$/, "");

  function base64ToBytes(b64: string) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function muLawToPCM16(u8: Uint8Array) {
    const out = new Int16Array(u8.length);
    for (let i = 0; i < u8.length; i++) {
      let u = (~u8[i]) & 0xff;
      let sign = (u & 0x80) ? -1 : 1;
      let exponent = (u >> 4) & 0x07;
      let mantissa = u & 0x0f;
      let sample = ((mantissa << 4) + 8) << (exponent + 3);
      sample = (sample - 33) * sign;
      out[i] = sample;
    }
    return out;
  }

  async function playPCM16(pcm16: Int16Array, rate = 8000) {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext({ sampleRate: rate });
    }
    const ctx = audioCtxRef.current;
    const buf = ctx.createBuffer(1, pcm16.length, rate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) ch[i] = pcm16[i] / 32768;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  }

  useEffect(() => {
    // Connect monitor WS when we have a call_control_id
    if (!result?.call_control_id) return;
    try {
      const url = `${wsBase}/telnyx/monitor/${encodeURIComponent(result.call_control_id)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = async (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.event === "media" && msg?.codec === "PCMU" && msg?.payload) {
            const u = base64ToBytes(msg.payload);
            const pcm16 = muLawToPCM16(u);
            await playPCM16(pcm16, msg?.rate || 8000);
          }
        } catch (err) {
          // ignore parse errors
        }
      };
      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch (e) {
      // no-op
    }
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
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
          {result.media_ws_url && <div>media_ws_url: {result.media_ws_url}</div>}
          <div style={{ marginTop: 8, color: "#666" }}>
            Monitoring audio via WS. Direction tags available in payload.
          </div>
        </div>
      )}
    </div>
  );
}