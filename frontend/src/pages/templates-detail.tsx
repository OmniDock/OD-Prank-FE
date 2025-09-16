import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import DefaultLayout from "@/layouts/default";
import { fetchPublicScenario } from "@/lib/api.scenarios";
import type { Scenario, VoiceLine } from "@/types/scenario";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { labelLanguage, labelVoiceLineType } from "@/lib/i18n";
import { fetchVoices } from "@/lib/api.tts";
import type { VoiceItem } from "@/types/tts";
// import { AudioPlayerModal } from "@/components/ui/audio-player-modal";

function getLanguageFlag(language: string) {
  const flags: Record<string, string> = {
    GERMAN: "🇩🇪",
    ENGLISH: "🇬🇧",
    SPANISH: "🇪🇸",
    FRENCH: "🇫🇷",
    ITALIAN: "🇮🇹",
  };
  return flags[language] || "🌍";
}

// Temporary hero image per scenario (stable per ID)
function getScenarioImage(seed: number | string, width = 1600, height = 700) {
  return `https://picsum.photos/seed/od-template-${encodeURIComponent(String(seed))}/${width}/${height}`;
}

function resolveScenarioImageUrl(url?: string | null, seed?: number | string, width = 1600, height = 700) {
  const invalid = !url || typeof url !== "string" || ["null", "none", "undefined", ""].includes(url.trim().toLowerCase());
  if (invalid) return getScenarioImage(seed ?? Math.random(), width, height);
  return url;
}

function stripTtsDirectives(text?: string | null) {
  if (!text) return "";
  // Remove bracketed directives like [whispers], [laughs], etc., and collapse whitespace
  const withoutDirectives = text.replace(/\s*\[[^\]]+\]\s*/g, " ");
  return withoutDirectives.replace(/\s+/g, " ").trim();
}

export default function TemplateDetailPage() {
  const { id } = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [voicesMap, setVoicesMap] = useState<Record<string, VoiceItem>>({});
  // Inline audio playback state (similar to dashboard VoiceLinesTable)
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [, setLoadingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setAudioRef = (audio: HTMLAudioElement | null) => {
    audioRef.current = audio;
  };
  const progressRafRef = useRef<number | null>(null);

  useEffect(() => {
    let abort = false;
    if (!id) return;
    (async () => {
      try {
        const [sc, vr] = await Promise.allSettled([
          fetchPublicScenario(id),
          fetchVoices(),
        ]);
        if (abort) return;

        if (sc.status === "fulfilled") setScenario(sc.value);
        if (vr.status === "fulfilled") {
          const map: Record<string, VoiceItem> = {};
          (vr.value.voices || []).forEach((v) => { map[v.id] = v; });
          setVoicesMap(map);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true };
  }, [id]);

  const voice = useMemo(() => {
    if (!scenario?.preferred_voice_id) return null;
    return voicesMap[scenario.preferred_voice_id] || null;
  }, [scenario?.preferred_voice_id, voicesMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause?.();
        }
      } catch {}
      if (progressRafRef.current !== null) cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    };
  }, []);

  const stopPlayback = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {}
    setPlayingId(null);
    setLoadingId(null);
    setProgress(0);
    setIsPaused(false);
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
  };

  const handlePlayCard = (voiceLineId: number, url?: string | null) => {
    if (!url) return; // no audio available

    // If same card active: stop
    if (playingId === voiceLineId && audioRef.current) {
      stopPlayback();
      return;
    }

    // Stop any existing
    if (playingId !== null) stopPlayback();

    setLoadingId(voiceLineId);
    try {
      const audio = new Audio(url);
      setAudioRef(audio);

      audio.addEventListener("loadedmetadata", () => setProgress(0));
      audio.addEventListener("canplay", () => setLoadingId((id) => (id === voiceLineId ? null : id)));
      audio.addEventListener("play", () => {
        setPlayingId(voiceLineId);
        setIsPaused(false);
        setLoadingId(null);
        const loop = () => {
          if (!audioRef.current) return;
          const d = audioRef.current.duration || 0;
          const p = d > 0 ? Math.min((audioRef.current.currentTime / d), 1) : 0;
          setProgress(p);
          progressRafRef.current = requestAnimationFrame(loop);
        };
        if (progressRafRef.current !== null) cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = requestAnimationFrame(loop);
      });
      audio.addEventListener("pause", () => setIsPaused(true));
      audio.addEventListener("ended", () => {
        setIsPaused(false);
        setProgress(1);
        if (progressRafRef.current !== null) {
          cancelAnimationFrame(progressRafRef.current);
          progressRafRef.current = null;
        }
        stopPlayback();
      });
      audio.addEventListener("error", () => {
        if (progressRafRef.current !== null) {
          cancelAnimationFrame(progressRafRef.current);
          progressRafRef.current = null;
        }
        stopPlayback();
      });

      void audio.play().catch(() => {
        stopPlayback();
      });
    } catch {
      stopPlayback();
    }
  };

  return (
    <DefaultLayout>
      <section className="py-0 mt-10">
        

        <div className="container mx-auto px-4 max-w-7xl py-10">
          {loading && (
            <div className="space-y-6">
              <div className="h-72 md:h-96 bg-default-100 rounded-2xl animate-pulse" />
              <div className="h-10 w-2/3 bg-default-100 rounded animate-pulse" />
              <div className="h-10 w-2/3 bg-default-100 rounded animate-pulse" />
              <div className="h-10 w-2/3 bg-default-100 rounded animate-pulse" />
              <div className="h-5 w-1/3 bg-default-100 rounded animate-pulse" />
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-default-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {!loading && scenario && (
            <div className="flex flex-col gap-8">
              {/* Title/description with responsive image+avatar aside */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                <div className="md:col-span-2">
                  <div className="relative w-full">
                    <div className="overflow-hidden rounded-2xl bg-default-100">
                      <img
                        src={resolveScenarioImageUrl(scenario.background_image_url, scenario.id, 1200, 800)}
                        alt={scenario.title}
                        className="w-full h-72 md:h-96 object-cover"
                        loading="lazy"
                      />
                    </div>
                    {voice?.avatar_url && (
                      <div className="absolute -bottom-5 -right-5 md:-bottom-6 md:-right-6 z-20">
                        <img
                          src={voice.avatar_url}
                          alt={voice.name}
                          className="w-28 h-28 md:w-32 md:h-32 rounded-full ring-2 ring-background/70 shadow-xl object-cover bg-white"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{scenario.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Chip size="sm" variant="flat" color="primary" className="rounded-full">
                      {getLanguageFlag(scenario.language)} {labelLanguage(scenario.language as any)}
                    </Chip>
                    {voice?.name && (
                      <Chip size="sm" variant="flat" color="secondary" className="rounded-full">
                        {voice.name}
                      </Chip>
                    )}
                  </div>
                  {scenario.description && (
                    <p className="text-default-600 leading-relaxed mt-4">{scenario.description}</p>
                  )}
                </div>
              </div>

              {/* Voice lines list with inline playback and progress, similar to dashboard */}
              <div>
                <h2 className="text-2xl font-bold mb-2">Sprachzeilen</h2>
                <h3 className="text-md text-default-500 font-medium mb-4">Zum Abspielen auf die Sprachzeile klicken</h3>
                <div className="space-y-4">
                  {scenario.voice_lines.map((vl: VoiceLine, idx: number) => {
                    const showSeparator = idx > 0 && scenario.voice_lines[idx - 1]?.type !== vl.type;
                    return (
                      <div key={vl.id}>
                        {showSeparator && (
                          <div className="w-full bg-primary/30 border border-primary rounded-lg my-2 mt-8 px-2 py-1 text-sm text-primary font-medium opacity-80">
                            {labelVoiceLineType(vl.type as any)}
                          </div>
                        )}
                        <Card className="border-default-200/60 hover:shadow-lg transition-shadow">
                          <CardBody className="relative">
                            {/* Progress overlay */}
                            {playingId === vl.id && (
                              <div className="absolute inset-0 z-0 overflow-hidden rounded-medium pointer-events-none">
                                <div
                                  className={`h-full bg-emerald-500/30 ${isPaused ? "opacity-60" : "opacity-90"}`}
                                  style={{ width: `${Math.min(progress * 100, 100)}%` }}
                                />
                              </div>
                            )}

                            <div
                              className="relative z-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between cursor-pointer"
                              onClick={() => handlePlayCard(vl.id, vl.preferred_audio?.signed_url)}
                            >
                              <div>
                                <div className="text-sm text-default-400">#{vl.order_index + 1} • {labelVoiceLineType(vl.type as any)}</div>
                                <div className="font-medium">{stripTtsDirectives(vl.text)}</div>
                              </div>
                              {/* <div className="text-xs text-default-500">
                                {vl.preferred_audio?.signed_url ? (playingId === vl.id ? (isPaused ? "Paused" : "Playing…") : "Tap to play") : "Audio nicht verfügbar"}
                              </div> */}
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}


