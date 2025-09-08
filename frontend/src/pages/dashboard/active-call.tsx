import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import type { Scenario, VoiceLine, VoiceLineType } from "@/types/scenario";
import { fetchScenario } from "@/lib/api.scenarios";
import { TelnyxRTCProvider, Audio } from "@telnyx/react-client";
import { useTelnyxConference } from "@/hooks/useTelnyxConference";
import { apiFetch } from "@/lib/api";
import { getAudioUrl } from "@/lib/api.tts";
import { StopIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

type StartCallResponse = {
  call_control_id: string;
  call_leg_id?: string;
  call_session_id?: string;
  conference_name?: string;
  webrtc_token?: string;
};

type LocationState = {
  scenarioId?: number;
  result?: StartCallResponse;
};

function groupByType(voiceLines: VoiceLine[]) {
  const order: VoiceLineType[] = ["OPENING", "FILLER", "QUESTION", "RESPONSE", "CLOSING"];
  const map: Record<VoiceLineType, VoiceLine[]> = {
    OPENING: [],
    QUESTION: [],
    RESPONSE: [],
    CLOSING: [],
    FILLER: [],
  };
  for (const vl of voiceLines) map[vl.type].push(vl);
  return order.map((t) => ({ type: t, items: map[t] }));
}

function ActiveCallContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [params] = useSearchParams();

  const fallbackScenarioId = params.get("scenarioId") ? Number(params.get("scenarioId")) : undefined;
  const scenarioId = state?.scenarioId ?? fallbackScenarioId;

  const [result] = useState<StartCallResponse | null>(state?.result ?? null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio playback state for visualizer
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingLineId, setPlayingLineId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRafRef = useRef<number | null>(null);
  const confStartAtRef = useRef<number | null>(null);
  const confTargetMsRef = useRef<number | null>(null);
  const confCurrentLineIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scenarioId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchScenario(scenarioId);
        setScenario(s);
      } catch (e: any) {
        setError(e?.message || "Failed to load scenario");
      } finally {
        setLoading(false);
      }
    })();
  }, [scenarioId]);

  const grouped = useMemo(() => groupByType(scenario?.voice_lines ?? []), [scenario]);

  const playVoiceLine = async (voiceLineId: number) => {
    // If clicking the same line that's playing, toggle stop based on mode
    if (playingLineId === voiceLineId && isPlaying) {
      if (result?.conference_name) {
        await stopConferencePlayback();
      } else {
        stopPlayback();
      }
      return;
    }

    // Conference mode: publish to Telnyx and mark active tile
    if (result?.conference_name) {
      try {
        // cancel any prior simulated progress
        if (progressRafRef.current !== null) {
          cancelAnimationFrame(progressRafRef.current);
          progressRafRef.current = null;
        }
        const res = await apiFetch("/telnyx/call/play-voiceline", {
          method: "POST",
          body: JSON.stringify({
            conference_name: result.conference_name,
            voice_line_id: voiceLineId,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        setPlayingLineId(voiceLineId);
        setIsPlaying(true);
        setIsPaused(false);
        setProgress(0);

        // Simulate progress using known duration when available
        const vl = scenario?.voice_lines.find(v => v.id === voiceLineId);
        let durationMs = vl?.preferred_audio?.duration_ms ?? null;
        // Defensive: if backend sent seconds, convert to ms
        if (durationMs && durationMs > 0 && durationMs < 1000) {
          durationMs = durationMs * 1000;
        }
        confCurrentLineIdRef.current = voiceLineId;
        if (durationMs && durationMs > 0) {
          confTargetMsRef.current = durationMs;
          confStartAtRef.current = performance.now();

          const loop = () => {
            if (confStartAtRef.current == null || confTargetMsRef.current == null) return;
            const elapsed = performance.now() - confStartAtRef.current;
            const p = Math.min(elapsed / confTargetMsRef.current, 1);
            setProgress(p);
            if (p < 1 && confCurrentLineIdRef.current === voiceLineId) {
              progressRafRef.current = requestAnimationFrame(loop);
            } else {
              // Auto-clear after finish
              setIsPaused(false);
              setIsPlaying(false);
              setPlayingLineId((id) => (id === voiceLineId ? null : id));
              progressRafRef.current = null;
              confStartAtRef.current = null;
              confTargetMsRef.current = null;
              confCurrentLineIdRef.current = null;
            }
          };
          progressRafRef.current = requestAnimationFrame(loop);
        } else {
          // No duration known: animate linear curtain with a default duration
          const DEFAULT_MS = 3000;
          confTargetMsRef.current = DEFAULT_MS;
          confStartAtRef.current = performance.now();
          const loop = () => {
            if (confStartAtRef.current == null || confTargetMsRef.current == null) return;
            const elapsed = performance.now() - confStartAtRef.current;
            const p = Math.min(elapsed / confTargetMsRef.current, 1);
            setProgress(p);
            if (p < 1 && confCurrentLineIdRef.current === voiceLineId) {
              progressRafRef.current = requestAnimationFrame(loop);
            } else {
              progressRafRef.current = null;
              confStartAtRef.current = null;
              confTargetMsRef.current = null;
              confCurrentLineIdRef.current = null;
              setIsPaused(false);
              setIsPlaying(false);
              setPlayingLineId((id) => (id === voiceLineId ? null : id));
            }
          };
          progressRafRef.current = requestAnimationFrame(loop);
        }
      } catch (error) {
        console.error("Failed to play voice line to conference:", error);
      }
      return;
    }

    // Local preview mode: play with progress animation
    const voiceLine = scenario?.voice_lines.find(vl => vl.id === voiceLineId);
    if (voiceLine && audioRef.current) {
      try {
        setLoadingId(voiceLineId);
        const audioUrlResponse = await getAudioUrl(voiceLine.id, scenario?.preferred_voice_id || undefined);
        if (audioUrlResponse.status === "PENDING") {
          setLoadingId(null);
          return;
        }
        if (audioUrlResponse.signed_url) {
          audioRef.current.src = audioUrlResponse.signed_url;
          setPlayingLineId(voiceLineId);
          setIsPlaying(true);
          setIsPaused(false);
          setProgress(0);

          const startLoop = () => {
            if (!audioRef.current) return;
            const loop = () => {
              if (!audioRef.current) return;
              const d = audioRef.current.duration || 0;
              const p = d > 0 ? Math.min(audioRef.current.currentTime / d, 1) : 0;
              setProgress(p);
              progressRafRef.current = requestAnimationFrame(loop);
            };
            if (progressRafRef.current !== null) cancelAnimationFrame(progressRafRef.current);
            progressRafRef.current = requestAnimationFrame(loop);
          };
          audioRef.current.addEventListener("play", startLoop, { once: true });

          await audioRef.current.play();
          setLoadingId(null);
        } else {
          setLoadingId(null);
        }
      } catch (error) {
        console.error("Failed to play audio locally:", error);
        setLoadingId(null);
        setIsPlaying(false);
        setPlayingLineId(null);
      }
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
    confStartAtRef.current = null;
    confTargetMsRef.current = null;
    confCurrentLineIdRef.current = null;
    setProgress(0);
    setIsPaused(false);
    setPlayingLineId(null);
    setIsPlaying(false);
    setLoadingId(null);
  };

  // Add a stop conference playback function after line 73:
  const stopConferencePlayback = async () => {
    if (!result?.conference_name) return;
    
    try {
      const res = await apiFetch("/telnyx/call/stop-voiceline", {
        method: "POST",
        body: JSON.stringify({
          conference_name: result.conference_name,
          voice_line_id: 0, // Not used in stop endpoint
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      // Also stop local playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (progressRafRef.current !== null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      confStartAtRef.current = null;
      confTargetMsRef.current = null;
      confCurrentLineIdRef.current = null;
      setProgress(0);
      setPlayingLineId(null);
      setIsPlaying(false);
    } catch (error) {
      console.error("Failed to stop conference playback:", error);
    }
  };

  // interruptPlayback no longer used in simplified UI

  if (!scenarioId) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Active Call</h1>
        </div>
        <Card>
          <CardBody className="space-y-3">
            <div className="text-danger">Missing scenario context.</div>
            <Button size="sm" onPress={() => navigate(-1)}>Go back</Button>
          </CardBody>
        </Card>
      </section>
    );
  }

  // Add audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      stopPlayback();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    const handlePause = () => setIsPaused(true);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // handleHangup moved to WebRTCMonitor

  // Listen for global interrupt events from the Call Monitoring card
  useEffect(() => {
    const onInterrupt = () => {
      stopPlayback();
    };
    window.addEventListener('call-interrupt', onInterrupt as EventListener);
    return () => window.removeEventListener('call-interrupt', onInterrupt as EventListener);
  }, []);

  return (
    <section className="space-y-6">

        {/* Hidden audio element for visualizer */}
        <audio ref={audioRef} className="hidden" />

      {loading ? (
        <div className="flex items-center gap-2 text-default-500">
          <Spinner size="sm" /> Loading scenario...
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <div className="text-danger">{error}</div>
            <Button className="mt-3" size="sm" onPress={() => navigate(-1)}>Go back</Button>
          </CardBody>
        </Card>
      ) : scenario ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="gap-6"
        >
          {/* Main content - Voice Lines (tile style) */}
          <div className="space-y-6">
            {grouped.map(({ type, items }) => (
              <Card key={type} className="shadow-medium">
                <CardHeader className="bg-gradient-to-r from-default-100 to-default-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${type === 'OPENING' ? 'bg-primary/20 text-primary' : 
                        type === 'QUESTION' ? 'bg-secondary/20 text-secondary' :
                        type === 'RESPONSE' ? 'bg-success/20 text-success' :
                        type === 'CLOSING' ? 'bg-warning/20 text-warning' :
                        type === 'FILLER' ? 'bg-warning/20 text-warning' :
                        'bg-default-100 text-default-700'}
                    `}>
                      {type === 'OPENING' ? '👋' : 
                       type === 'QUESTION' ? '❓' :
                       type === 'RESPONSE' ? '💬' :
                       type === 'CLOSING' ? '👋' :
                       type === 'FILLER' ? '👋' :
                       '👋'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {type === 'OPENING' ? 'Opening Lines' : 
                         type === 'QUESTION' ? 'Questions' :
                         type === 'RESPONSE' ? 'Responses' :
                         type === 'CLOSING' ? 'Closing Lines' :
                         type === 'FILLER' ? 'Fillers' :
                         'Voice Lines'}
                      </h3>
                      <p className="text-xs text-default-500">{items.length} available</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-default-400">
                      No {type.toLowerCase()} lines available
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {items.map((vl) => {
                        const isActive = playingLineId === vl.id;
                        const isLoading = loadingId === vl.id;
                        const url = scenario?.voice_lines.find(x => x.id === vl.id)?.preferred_audio?.signed_url || null;

                        return (
                          <div
                            key={vl.id}
                            className={`relative shadow-md inline-flex ${isActive ? "ring-1 ring-success bg-success-400 hover:bg-success-400" : "ring-1 ring-default-100"} bg-gradient-surface glass-card rounded-medium p-3 cursor-pointer transition-colors ${
                              isLoading ? "bg-default-200 animate-pulse" : "bg-content1 hover:bg-default-100"
                            }`}
                            onClick={() => playVoiceLine(vl.id)}
                          >
                            {/* Progress overlay (curtain) */}
                            {isActive && (
                              <div className="absolute inset-0 z-0 overflow-hidden rounded-medium pointer-events-none">
                                <div
                                  className={`h-full bg-emerald-500/30 ${isPaused ? "opacity-60" : "opacity-90"}`}
                                  style={{ width: `${Math.min(progress * 100, 100)}%` }}
                                />
                              </div>
                            )}

                            <div className="relative z-10">
                              <div className="mt-1  whitespace-pre-wrap break-words">
                                {(vl.text || "")
                                  .replace(/\[\[.*?\]\]/gi, "")
                                  .replace(/\[(?!\*)([^[[\]]*?)\]/g, "")
                                }
                              </div>
                              {!result?.conference_name && !url && (
                                <div className="text-xs text-default-400 mt-1">No audio yet</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>


        </motion.div>
      ) : null}
    </section>
  );
}

export default function ActiveCallPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const result = state?.result;

  // If we have WebRTC credentials, wrap in provider
  if (result?.webrtc_token && result?.conference_name) {
    return (
      <TelnyxRTCProvider 
        credential={{ login_token: result.webrtc_token } as any} 
        options={{ debug: true }}
      >
        <WebRTCMonitor token={result.webrtc_token} conference={result.conference_name} />
        <ActiveCallContent />
      </TelnyxRTCProvider>
    );
  }

  // Otherwise just show the regular content
  return <ActiveCallContent />;
}

function WebRTCMonitor({ token, conference }: { token: string; conference: string }) {
  const navigate = useNavigate();
  const { remoteStream, connectionState } = useTelnyxConference({ 
    token, 
    conference,
    autoJoin: true 
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [pstnJoined, setPstnJoined] = useState(false);

  const handleInterrupt = async () => {
    try {
      await apiFetch("/telnyx/call/stop-voiceline", {
        method: "POST",
        body: JSON.stringify({ conference_name: conference, voice_line_id: 0 }),
      });
      // notify tiles to reset playing state
      window.dispatchEvent(new CustomEvent('call-interrupt'));
    } catch (err) {
      // no-op
    }
  };

  const handleHangup = async () => {
    try {
      const response = await apiFetch("/telnyx/call/hangup", {
        method: "POST",
        body: JSON.stringify({ conference_name: conference }),
      });

      if (!response.ok) {
        throw new Error('Failed to hang up call');
      }
    } catch (err) {
      console.error('Error hanging up call:', err);
    }
  };

  // Handle hangup - navigate back or show message
  useEffect(() => {
    if (connectionState === "hangup") {
      // Auto-navigate back after 3 seconds
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, navigate]);

  // Waveform animation using analyser; draw baseline when not connected
  useEffect(() => {
    const stream = remoteStream as MediaStream | null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const drawBaseline = () => {
      const { width, height } = canvas;
      ctx2d.clearRect(0, 0, width, height);
      ctx2d.strokeStyle = "rgba(200,200,200,0.5)";
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      ctx2d.moveTo(0, height / 2);
      ctx2d.lineTo(width, height / 2);
      ctx2d.stroke();
    };

    const teardown = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioCtxRef.current) {
        void audioCtxRef.current.suspend().catch(() => {});
      }
      drawBaseline();
    };

    if (connectionState !== "connected" || !stream) {
      teardown();
      return () => teardown();
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // helper to draw rounded rectangles
      const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        const rr = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + rr, rr);
        ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
        ctx.arcTo(x, y + h, x, y + h - rr, rr);
        ctx.arcTo(x, y, x + rr, y, rr);
        ctx.closePath();
      };

      const draw = () => {
        if (!canvas || !ctx2d || !analyserRef.current) return;
        const { width, height } = canvas;
        ctx2d.clearRect(0, 0, width, height);

        // Baseline
        ctx2d.strokeStyle = "rgba(200,200,200,0.5)";
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(0, height / 2);
        ctx2d.lineTo(width, height / 2);
        ctx2d.stroke();

        analyserRef.current.getByteFrequencyData(dataArray);
        const bars = 40;
        const barWidth = width / bars;
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor((i / bars) * bufferLength);
          const v = dataArray[idx] / 255;
          const maxBarHeight = (height / 2) * 0.9;
          const barHeight = Math.max(1, v * maxBarHeight);
          const x = i * barWidth + barWidth * 0.1;
          const yTop = height / 2 - barHeight;

          ctx2d.fillStyle = "rgba(34,197,94,0.85)";
          const rw = barWidth * 0.8;
          const radius = Math.min(rw / 2, 6);
          drawRoundedRect(ctx2d, x, yTop, rw, barHeight, radius);
          ctx2d.fill();
          drawRoundedRect(ctx2d, x, height / 2, rw, barHeight, radius);
          ctx2d.fill();
        }

        rafRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch {
      drawBaseline();
    }

    return () => teardown();
  }, [remoteStream, connectionState]);

  // Poll backend for PSTN presence status
  useEffect(() => {
    if (!conference) return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await apiFetch(`/telnyx/call/status?conference_name=${encodeURIComponent(conference)}`);
        if (!stopped) {
          const data = await res.json();
          setPstnJoined(Boolean(data?.pstn_joined));
        }
      } catch {
        // ignore transient
      }
    };
    const id = window.setInterval(poll, 1500);
    void poll();
    return () => { stopped = true; window.clearInterval(id); };
  }, [conference]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Call Monitoring</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col items-center gap-4">
          <div className="text-sm">
            {connectionState !== "connected" ? (
              <span className="text-warning font-medium">● Connecting…</span>
            ) : !pstnJoined ? (
              <span className="text-default-500">● Waiting for called to join…</span>
            ) : (
              <span className="text-success font-medium">● Live</span>
            )}
          </div>
          <div className="w-full flex justify-center">
            <canvas ref={canvasRef} width={600} height={80} className="w-full max-w-2xl h-20" />
          </div>
          <Audio stream={remoteStream} autoPlay playsInline />
          <div className="flex items-center justify-center gap-3">
            <Button
              size="md"
              color="danger"
              variant="solid"
              onPress={handleInterrupt}
              startContent={<StopIcon className="w-4 h-4" />}
              isDisabled={connectionState !== "connected" || !pstnJoined}
            >
              Interrupt
            </Button>
            <Button
              size="md"
              color="danger"
              variant="flat"
              onPress={handleHangup}
            >
              End Call
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}


