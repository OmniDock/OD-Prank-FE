import { useContext, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { TelnyxRTCProvider, TelnyxRTCContext, useCallbacks, useNotification, Audio } from "@telnyx/react-client";
import { debug } from "console";

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
  const [audioStats] = useState({ inbound: 0, outbound: 0 });
  const [webrtcInfo, setWebrtcInfo] = useState<{ token: string; conference: string } | null>(null);

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

  async function startWebRTCMonitor() {
    try {
      if (!result?.call_control_id) return;
      const res = await apiFetch(`/telnyx/webrtc/token`, {
        method: "POST",
        body: JSON.stringify({ call_control_id: result.call_control_id, ttl_seconds: 300 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setWebrtcInfo({ token: data.token, conference: data.conference_name });
      // We render a provider below when webrtcInfo exists, which creates the client.
    } catch (e: any) {
      setError(e?.message || "WebRTC token failed");
    }
  }

  const page = (
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

        <button
          onClick={startWebRTCMonitor}
          disabled={!result?.call_control_id}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #08c",
            background: webrtcInfo ? "#08c" : "#09d",
            color: "#fff",
            cursor: !result?.call_control_id ? "not-allowed" : "pointer",
          }}
        >
          {webrtcInfo ? "Monitor (WebRTC) Ready" : "Start WebRTC Monitor"}
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
            {webrtcInfo && (
              <div style={{ marginTop: 8 }}>
                <div>🛰️ WebRTC Conference: {webrtcInfo.conference}</div>
                <div style={{ wordBreak: "break-all" }}>Token: {webrtcInfo.token}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // When we have a token, wrap page in TelnyxRTCProvider, auto-connect and join
  if (webrtcInfo?.token && webrtcInfo?.conference) {
    return (
      <TelnyxRTCProvider credential={{ login_token: webrtcInfo.token } as any} options={{debug:true}}>
        <TelnyxJoinConference conference={webrtcInfo.conference} />
        {page}
      </TelnyxRTCProvider>
    );
  }

  return page;
}


function TelnyxJoinConference({ conference }: { conference: string }) {
  const client = useContext(TelnyxRTCContext) as any;
  const notification = useNotification() as any;
  const activeCall = notification && notification.call;

  useCallbacks({
    onReady: () => {
      try {
        console.log(`Attempting to join conference: ${conference}`);
        client.newCall({
          destinationNumber: 'sip:omnidockbackend@sip.telnyx.eu',
          audio: true,
          video: false,
          clientState: btoa(conference),
        });
      } catch (error) {
        console.error('Failed to initiate call to join conference:', error);
      }
    },
    onError: (error: any) => {
      console.error('Error during call:', error);
    },
    onSocketError: () => console.log('client socket error'),
    onSocketClose: () => console.log('client disconnected'),
    onNotification: (x: any) => console.log('received notification:', x),
  });

  return (
    <div>
      <h2>Conference Call</h2>
      <Audio stream={activeCall?.remoteStream} autoPlay playsInline />
      {!activeCall && <p>Connecting to conference...</p>}
      {activeCall && activeCall.state !== 'active' && <p>Call state: {activeCall.state}</p>}
    </div>
  );
}