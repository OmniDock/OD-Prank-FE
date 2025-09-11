import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { PlayIcon, StopIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import type { Scenario } from "@/types/scenario";
import type { VoiceItem } from "@/types/tts";
 

interface VoiceSectionProps {
  scenario: Scenario;
  voices: VoiceItem[];
  onSelect: (voiceId: string) => Promise<void> | void;
}

export function VoiceSection({ scenario, voices, onSelect }: VoiceSectionProps) {
  const hasVoice = !!scenario.preferred_voice_id;
  if (hasVoice) {
    const vid = scenario.preferred_voice_id!;
    const v = voices.find(x => x.id === vid);
    const generatedCount = scenario.voice_lines?.filter(vl => !!vl.preferred_audio?.signed_url).length || 0;
    const totalCount = scenario.voice_lines?.length || 0;

    return (
      <Card className="ring-1 ring-primary/20 bg-primary/5">
        <CardBody className="gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
              {v?.avatar_url ? (
                <img
                  src={v.avatar_url}
                  alt={v.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Voice</h3>
              <p className="text-sm text-default-500">Locked for this scenario</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50 border border-default-200">
            <div className="flex-1">
              <div className="text-sm font-medium text-default-700">Selected Voice</div>
              <div className="text-base font-semibold text-foreground mt-1">
                {v ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span>{v.name}</span>
                      <Chip size="sm" variant="flat" color="primary">{v.gender}</Chip>
                      {v.languages.map(l => (
                        <Chip key={`${v.id}-${l}`} size="sm" variant="flat">{l}</Chip>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-default-500">Samples:</span>
                      <Chip size="sm" variant="flat" color={generatedCount === totalCount ? "success" : generatedCount > 0 ? "warning" : "default"}>
                        {generatedCount}/{totalCount}
                      </Chip>
                    </div>
                  </div>
                ) : (
                  <span className="text-default-600">{vid}</span>
                )}
              </div>
            </div>
            <Chip size="sm" color="default" variant="flat">Locked</Chip>
          </div>
        </CardBody>
      </Card>
    );
  }

  return <InlineSelector voices={voices} onSelect={onSelect} defaultLanguage={scenario.language} defaultGender={scenario.scenario_analysis?.analysis?.persona_gender} />;
}

interface InlineSelectorProps {
  voices: VoiceItem[];
  onSelect: (voiceId: string) => Promise<void> | void;
  defaultLanguage?: "GERMAN" | "ENGLISH";
  defaultGender?: "MALE" | "FEMALE";
}

function InlineSelector({ voices, onSelect, defaultLanguage, defaultGender }: InlineSelectorProps) {
  const [query] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "MALE" | "FEMALE">(defaultGender || "ALL");
  const [languageFilter, setLanguageFilter] = useState<"ALL" | "GERMAN" | "ENGLISH">(defaultLanguage || "ALL");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRafRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressRafRef.current !== null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
    };
  }, []);

  const filtered = useMemo(() => {
    let list = voices;
    const q = debouncedQuery;
    if (q) {
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        (v.description || "").toLowerCase().includes(q) ||
        v.languages.join(",").toLowerCase().includes(q)
      );
    }
    if (genderFilter !== "ALL") {
      list = list.filter(v => v.gender === genderFilter);
    }
    if (languageFilter !== "ALL") {
      list = list.filter(v => v.languages.includes(languageFilter));
    }
    return list;
  }, [voices, debouncedQuery, genderFilter, languageFilter]);


  function stopPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
    setIsPlaying(false);
    setPreviewingId(null);
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
    setProgress(0);
  }

  function handleCardClick(voice: VoiceItem) {
    if (!voice.preview_url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    // If same card is active: stop playback instead of pausing
    if (previewingId === voice.id && isPlaying) {
      stopPlayback();
      return;
    }

    // New card: stop any existing playback
    if (previewingId !== null && previewingId !== voice.id) {
      stopPlayback();
    }

    if (audio.src !== voice.preview_url) {
      audio.src = voice.preview_url;
    }

    audio.onplay = () => {
      // Smooth progress loop
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
    audio.onpause = () => {
      if (progressRafRef.current !== null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
    };
    audio.onended = () => {
      if (progressRafRef.current !== null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      setProgress(1);
      stopPlayback();
    };
    audio.onerror = () => {
      stopPlayback();
    };

    void audio.play().then(() => {
      setPreviewingId(voice.id);
      setIsPlaying(true);
    }).catch(() => {
      stopPlayback();
    });
  }

  return (
    <Card className="ring-1 ring-primary/20 bg-primary/5">
      <CardBody className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
            <span className="text-2xl">🔊</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Sprache auswählen</h3>
            <p className="text-sm text-default-500">Wähle eine Sprache, um Audio-Generierung zu starten. Dies kann später nicht mehr geändert werden.</p>
          </div>
        </div>

        <div className="rounded-large border border-default-200 bg-default-50/50 p-3">
          {/* <div className="grid grid-cols-2 justify-center md:grid-cols-[1fr_auto_auto] items-center gap-3"> */}
          <div className="flex flex-row items-center justify-center gap-12">
            {/* <div className="w-full">
              <Input
                size="md"
                placeholder="Search by name, id, description, language…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                variant="faded"
                className="w-full bg-transparent"
              />
            </div> */}
            <div className="flex items-center justify-start md:justify-center">
              <div className="inline-flex items-center gap-1 rounded-medium bg-default-100 p-1">
                <Button size="sm" variant={genderFilter === "ALL" ? "solid" : "light"} color="primary" onClick={() => setGenderFilter("ALL")}>All</Button>
                <Button size="sm" variant={genderFilter === "MALE" ? "solid" : "light"} color="primary" onClick={() => setGenderFilter("MALE")}>Male</Button>
                <Button size="sm" variant={genderFilter === "FEMALE" ? "solid" : "light"} color="primary" onClick={() => setGenderFilter("FEMALE")}>Female</Button>
              </div>
            </div>
            <div className="flex items-center justify-start md:justify-center">
              <div className="inline-flex items-center gap-1 rounded-medium bg-default-100 p-1">
                <Button size="sm" variant={languageFilter === "ALL" ? "solid" : "light"} color="primary" onClick={() => setLanguageFilter("ALL")}>All</Button>
                <Button size="sm" variant={languageFilter === "GERMAN" ? "solid" : "light"} color="primary" onClick={() => setLanguageFilter("GERMAN")}>German</Button>
                <Button size="sm" variant={languageFilter === "ENGLISH" ? "solid" : "light"} color="primary" onClick={() => setLanguageFilter("ENGLISH")}>English</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filtered.map((v) => {
            const isActive = previewingId === v.id && isPlaying;
            return (
              <div
                key={v.id}
                className={`relative p-3 rounded-medium shadow-md glass-card bg-gradient-surface border border-default-200 cursor-pointer transition-colors ${isActive ? "ring-1 ring-primary bg-primary-400 hover:bg-primary-400" : "hover:bg-default-100"}`}
                onClick={() => handleCardClick(v)}
              >
                {isActive && (
                  <div className="absolute inset-0 z-0 overflow-hidden rounded-medium pointer-events-none">
                    <div
                      className="h-full bg-primary/30"
                      style={{ width: `${Math.min(progress * 100, 100)}%` }}
                    />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                      <div className="relative z-10 w-full h-full rounded-full overflow-hidden ring-2 ring-white/80 shadow-lg bg-white flex items-center justify-center">
                        {v.avatar_url ? (
                          <img
                            src={v.avatar_url}
                            alt={v.name}
                            className="w-full h-full object-cover"
                          />
                        ) : v.name?.[0] ? (
                          <span className="text-lg md:text-xl font-semibold text-primary">
                            {v.name[0].toUpperCase()}
                          </span>
                        ) : (
                          <UserIcon className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        color={isActive ? "default" : "primary"}
                        variant={isActive ? "flat" : "light"}
                        onClick={(e) => { e.stopPropagation(); handleCardClick(v); }}
                        className="absolute -bottom-2 -right-2 z-20 rounded-full bg-white/80 backdrop-blur border border-default-200 shadow"
                        aria-label={isActive ? "Stop" : "Play"}
                      >
                        {isActive ? (
                          <StopIcon className="w-4 h-4" />
                        ) : (
                          <PlayIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-semibold text-base">{v.name}</span>
                        <Chip size="sm" variant="flat">{v.gender}</Chip>
                        {v.languages.map(l => (
                          <Chip key={`${v.id}-${l}`} size="sm" variant="flat">{l}</Chip>
                        ))}
                      </div>
                      {v.description && <div className="text-md text-default-500 mt-1 line-clamp-2">{v.description}</div>}
                    </div>
                  </div>
                </div>
                <div className={`mt-3 transition-opacity ${isActive ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                  <Button size="sm" color="primary" className="w-full bg-gradient-primary" onClick={(e) => { e.stopPropagation(); void onSelect(v.id); }}>
                    Select
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-default-500">No voices match your filters.</div>
          )}
        </div>

        <audio ref={audioRef} />
      </CardBody>
    </Card>
  );
}


