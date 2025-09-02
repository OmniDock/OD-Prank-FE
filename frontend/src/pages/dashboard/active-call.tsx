import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Spinner } from "@heroui/react";
import type { Scenario, VoiceLine, VoiceLineType } from "@/types/scenario";
import { fetchScenario } from "@/lib/api.scenarios";
import { TelnyxRTCProvider, Audio } from "@telnyx/react-client";
import { useTelnyxConference } from "@/hooks/useTelnyxConference";
import { apiFetch } from "@/lib/api";
import { getAudioUrl } from "@/lib/api.tts";
import { PlayIcon, StopIcon } from "@heroicons/react/24/solid";
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
  const order: VoiceLineType[] = ["OPENING", "QUESTION", "RESPONSE", "CLOSING", "FILLER"];
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
    // Stop current playback if playing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // If clicking the same line that's playing, just stop
    if (playingLineId === voiceLineId && isPlaying) {
      setPlayingLineId(null);
      setIsPlaying(false);
      return;
    }

    // Play to conference if available
    if (result?.conference_name) {
      try {
        const res = await apiFetch("/telnyx/call/play-voiceline", {
          method: "POST",
          body: JSON.stringify({
            conference_name: result.conference_name,
            voice_line_id: voiceLineId,
          }),
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
      } catch (error) {
        console.error("Failed to play voice line to conference:", error);
      }
    }

    // Play locally for visualization only when NOT in a conference
    if (!result?.conference_name) {
      const voiceLine = scenario?.voice_lines.find(vl => vl.id === voiceLineId);
      if (voiceLine && audioRef.current) {
        try {
          // Get audio URL for the voice line
          const audioUrlResponse = await getAudioUrl(voiceLine.id, scenario?.preferred_voice_id || undefined);
          
          if (audioUrlResponse.status === "PENDING") {
            console.log("Audio is still being generated");
            return;
          }
          
          if (audioUrlResponse.signed_url) {
            audioRef.current.src = audioUrlResponse.signed_url;
            setPlayingLineId(voiceLineId);
            setIsPlaying(true);
            
            await audioRef.current.play();
          }
        } catch (error) {
          console.error("Failed to play audio locally:", error);
          setIsPlaying(false);
          setPlayingLineId(null);
        }
      }
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingLineId(null);
    setIsPlaying(false);
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
      setPlayingLineId(null);
      setIsPlaying(false);
    } catch (error) {
      console.error("Failed to stop conference playback:", error);
    }
  };

  const interruptPlayback = async () => {
    if (result?.conference_name) {
      await stopConferencePlayback();
    } else {
      stopPlayback();
    }
  };

  if (!scenarioId) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Active Call</h1>
        </div>
        <Card>
          <CardBody className="space-y-3">
            <div className="text-danger">Missing scenario context.</div>
            <Button onPress={() => navigate(-1)}>Go back</Button>
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
      setIsPlaying(false);
      setPlayingLineId(null);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const handleHangup = async () => {
    if (!result?.conference_name) return;
    
    try {
      const response = await apiFetch("/telnyx/call/hangup", {
        method: "POST",
        body: JSON.stringify({ conference_name: result.conference_name }),
      });

      if (!response.ok) {
        throw new Error('Failed to hang up call');
      }

      // Navigate back after successful hangup
      navigate("/dashboard/phone-call");
    } catch (err) {
      console.error('Error hanging up call:', err);
    }
  };

  return (
    <section className="space-y-6">
      {/* Hidden audio element for visualizer */}
      <audio ref={audioRef} className="hidden" />

      {/* Header with scenario title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Active Call</h1>
          {scenario && (
            <>
              <Divider orientation="vertical" className="h-8" />
              <div className="flex items-center gap-3">
                <span className="text-xl font-medium text-default-700">{scenario.title}</span>
                <Chip 
                  size="sm" 
                  color={scenario.is_safe ? "success" : "danger"} 
                  variant="flat"
                >
                  {scenario.is_safe ? "Safe" : "Unsafe"}
                </Chip>
              </div>
            </>
          )}
        </div>
        {/* Header actions */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            color="danger"
            variant="solid"
            onPress={interruptPlayback}
            startContent={<StopIcon className="w-4 h-4" />}
          >
            Interrupt
          </Button>
          {result?.conference_name && (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={handleHangup}
            >
              End Call
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-default-500">
          <Spinner size="sm" /> Loading scenario...
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <div className="text-danger">{error}</div>
            <Button className="mt-3" onPress={() => navigate(-1)}>Go back</Button>
          </CardBody>
        </Card>
      ) : scenario ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6"
        >
          {/* Main content - Voice Lines */}
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
                        'bg-warning/20 text-warning'}
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
                         'Closing Lines'}
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
                    <div className="grid gap-3">
                      {items.map((vl) => (
                        <Button
                          key={vl.id}
                          variant={playingLineId === vl.id ? "solid" : "flat"}
                          color={playingLineId === vl.id ? "primary" : "default"}
                          className={`
                            justify-start text-left h-auto py-4 px-5
                            ${playingLineId === vl.id ? 'ring-2 ring-primary ring-offset-2' : ''}
                          `}
                          onPress={() => playVoiceLine(vl.id)}
                        >
                          <div className="flex items-center gap-4 w-full">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                              ${playingLineId === vl.id ? 'bg-white/20' : 'bg-default-100'}
                            `}>
                              {playingLineId === vl.id ? (
                                <StopIcon className="w-5 h-5" />
                              ) : (
                                <PlayIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`
                                text-base leading-relaxed
                                ${playingLineId === vl.id ? 'text-white' : 'text-foreground'}
                              `}>
                                {vl.text}
                              </p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Sidebar - Audio Visualizer */}
          <div className="space-y-4">
            {result?.conference_name && (
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold">Call Details</h3>
                </CardHeader>
                <CardBody className="space-y-2 text-xs">
                  <div>
                    <span className="text-default-500">Conference:</span>
                    <p className="font-mono text-default-700">{result.conference_name}</p>
                  </div>
                  {result.call_control_id && (
                    <div>
                      <span className="text-default-500">Call ID:</span>
                      <p className="font-mono text-default-700 truncate">{result.call_control_id}</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
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
  const { remoteStream, connectionState, error, hangupReason } = useTelnyxConference({ 
    token, 
    conference,
    autoJoin: true 
  });

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
        navigate("/dashboard/phone-call");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, navigate]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Call Monitor</h3>
          <div className="flex items-center gap-2">
            {connectionState === "connected" && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={handleHangup}
              >
                End Call
              </Button>
            )}
            <Chip 
              size="sm" 
              variant="flat" 
              color={
                connectionState === "connected" ? "success" : 
                connectionState === "hangup" ? "default" :
                connectionState === "error" ? "danger" : "warning"
              }
            >
              {connectionState === "hangup" ? "Call Ended" : connectionState}
            </Chip>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <Audio stream={remoteStream} autoPlay playsInline />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-default-500">Conference:</span>
            <span className="font-mono">{conference}</span>
          </div>
          {connectionState === "connected" && (
            <div className="text-success">🔇 Receive-only mode (no microphone access)</div>
          )}
          {connectionState === "connecting" && (
            <div className="text-warning">Connecting to conference...</div>
          )}
          {connectionState === "hangup" && (
            <div className="space-y-2">
              <div className="text-default-500">
                📞 {hangupReason || "Call ended"}
              </div>
              <div className="text-xs text-default-400">
                Redirecting back in 3 seconds...
              </div>
              <Button size="sm" variant="flat" onPress={() => navigate("/dashboard/phone-call")}>
                Back to Phone Call
              </Button>
            </div>
          )}
          {error && (
            <div className="text-danger text-xs">{error}</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}


