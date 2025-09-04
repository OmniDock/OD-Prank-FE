import { useState, useMemo, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { addToast, Spinner } from "@heroui/react";
import { generateSingleTTS, fetchVoiceLinesSummary } from "@/lib/api.tts";
import type { Scenario } from "@/types/scenario";

interface VoiceLinesTableProps {
  scenario: Scenario;
  onRefetchScenario: () => Promise<void>;
  onOpenPlayer: (voiceLineId: number) => void;
  selected?: Set<number>;
  onSelectionChange?: Dispatch<SetStateAction<Set<number>>>;
  onEnhanceSelected?: () => void;
}

export function VoiceLinesTable({
  scenario,
  onRefetchScenario,
  onOpenPlayer,
  selected,
  onSelectionChange,
  onEnhanceSelected,
}: VoiceLinesTableProps) {
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [activeTab] = useState<"ALL" | "OPENING" | "QUESTION" | "RESPONSE" | "CLOSING" | "FILLER">("ALL");
  const [summaryEtag, setSummaryEtag] = useState<string | undefined>(undefined);
  const [pollInterval, setPollInterval] = useState(2000);
  const [, setConsecutiveNoChanges] = useState(0);

  void onOpenPlayer;
  void onEnhanceSelected;

  // Inline audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRafRef = useRef<number | null>(null);

  // Helper function to check if audio is available for a voice line
  const isAudioAvailable = (voiceLineId: number): boolean => {
    if (!scenario?.voice_lines) return false;
    const voiceLine = scenario.voice_lines.find(vl => vl.id === voiceLineId);
    return !!(voiceLine?.preferred_audio?.signed_url);
  };

  // Define display order for types
  const typeOrder: Array<"OPENING" | "FILLER" | "QUESTION" | "RESPONSE" | "CLOSING"> = [
    "OPENING",
    "FILLER",
    "QUESTION",
    "RESPONSE",
    "CLOSING",
  ];

  // Group voice lines by type and sort inside each group by order_index
  const groupedVoiceLines = useMemo(() => {
    const result: Record<string, typeof scenario.voice_lines> = {} as any;
    if (!scenario?.voice_lines) return result;

    const source = activeTab === "ALL"
      ? scenario.voice_lines
      : scenario.voice_lines.filter(vl => vl.type === activeTab);

    for (const t of typeOrder) {
      result[t] = [] as any;
    }

    for (const vl of source) {
      if (!result[vl.type]) result[vl.type] = [] as any;
      result[vl.type].push(vl);
    }

    for (const t of Object.keys(result)) {
      result[t] = (result[t] || []).slice().sort((a, b) => a.order_index - b.order_index);
    }

    return result;
  }, [scenario?.voice_lines, activeTab]);

  const typeDisplayName: Record<string, string> = {
    OPENING: "Opening",
    FILLER: "Filler",
    QUESTION: "Questions",
    RESPONSE: "Responses",
    CLOSING: "Closing",
  };

  async function onGenerateSelectedAudio() {
    if (!scenario || !scenario.preferred_voice_id) {
      addToast({ 
        title: "No voice selected", 
        description: "Please select a preferred voice first.", 
        color: "warning", 
        timeout: 2000 
      });
      return;
    }

    if (!selected || selected.size === 0) {
      addToast({ 
        title: "No selection", 
        description: "Select voice lines to generate audio for.", 
        color: "warning", 
        timeout: 2000 
      });
      return;
    }

    const selectedIds = Array.from(selected);
    let successCount = 0;
    let failCount = 0;
    let alreadyGeneratedCount = 0;

    // Filter out voice lines that already have audio
    const toGenerate = selectedIds.filter(id => !isAudioAvailable(id));
    alreadyGeneratedCount = selectedIds.length - toGenerate.length;

    if (toGenerate.length === 0) {
      addToast({ 
        title: "Audio already generated", 
        description: "All selected voice lines already have audio.", 
        color: "default", 
        timeout: 2000 
      });
      return;
    }

    // Add to generating set
    setGenerating(new Set([...generating, ...toGenerate]));

    for (const voiceLineId of toGenerate) {
      try {
        const res = await generateSingleTTS({ 
          voice_line_id: voiceLineId, 
          voice_id: scenario.preferred_voice_id 
        });
        
        if (res.success) {
          successCount++;
          if (!res.signed_url) {
            // Mark as pending if generation started in background
            setPending((prev) => new Set(prev).add(voiceLineId));
          }
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      } finally {
        // Remove from generating set
        setGenerating((prev) => {
          const next = new Set(prev);
          next.delete(voiceLineId);
          return next;
        });
      }
    }

    if (successCount > 0) {
      addToast({ 
        title: "Generation started", 
        description: `Started generating ${successCount} audio files`, 
        color: "primary", 
        timeout: 2000 
      });
      // Refresh scenario after a delay to update audio status
      setTimeout(onRefetchScenario, 2000);
    }

    if (failCount > 0) {
      addToast({ 
        title: "Some generations failed", 
        description: `Failed to generate ${failCount} audio files`, 
        color: "warning", 
        timeout: 3000 
      });
    }

    if (alreadyGeneratedCount > 0) {
      addToast({ 
        title: "Some already have audio", 
        description: `${alreadyGeneratedCount} voice lines already have audio`, 
        color: "default", 
        timeout: 2000 
      });
    }

    // Clear selection after generation
    onSelectionChange && onSelectionChange(new Set());
  }

  async function onCreateAudio(voiceLineId: number) {
    if (!scenario || !scenario.preferred_voice_id) {
      addToast({ title: "No voice selected", description: "Select a voice first to generate audio.", color: "warning", timeout: 1000 });
      return;
    }
        
    try {
      const res = await generateSingleTTS({ 
        voice_line_id: voiceLineId, 
        voice_id: scenario.preferred_voice_id 
      });
            
      if (res.success) {
          if (res.signed_url) {
            await onRefetchScenario();
            addToast({ 
              title: "Audio ready", 
              description: "Audio file already exists.", 
              color: "success", 
              timeout: 1000 
            });
            return;
          }
          // Mark as pending; summary poller will pick up
          setPending((prev) => new Set(prev).add(voiceLineId));

          addToast({ 
            title: "Generation started", 
            description: "Audio is being generated.", 
            color: "primary", 
            timeout: 1000 
          });
      } else {
        addToast({
          title: "Generation failed",
          description: res.error_message || "Failed to generate audio",
          color: "danger",
          timeout: 3000,
        });
      }
    } catch (e) {
      addToast({
        title: "Request failed",
        description: "Failed to generate audio",
        color: "danger",
        timeout: 3000,
      });
    }
  }

  // Mark local handlers as used for linter when UI controls are not rendering them directly
  void onGenerateSelectedAudio;
  void onCreateAudio;

  // Summary polling with ETag (only when there are pending items)
  useEffect(() => {
    if (!scenario?.id) return;
    if (pending.size === 0) {
      // Reset polling state when no pending items
      setPollInterval(2000);
      setConsecutiveNoChanges(0);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetchVoiceLinesSummary(scenario.id, summaryEtag);
        if (cancelled) return;
        
        if (res.notModified) {
          // Exponential backoff when no changes detected
          setConsecutiveNoChanges(prev => prev + 1);
          setPollInterval(prev => Math.min(prev * 1.5, 10000)); // Max 10 seconds
          return;
        }

        // Reset fast polling on change
        setConsecutiveNoChanges(0);
        setPollInterval(2000);

        if (res.etag) setSummaryEtag(res.etag);
        const items = res.data?.items || [];

        // Determine which IDs moved to READY
        const readyIds = new Set<number>();
        for (const it of items) {
          if (it.status === "READY") {
            readyIds.add(it.voice_line_id);
          }
        }

        // Remove READY from pending
        if (readyIds.size > 0) {
          setPending((prev) => {
            const next = new Set(prev);
            for (const id of Array.from(readyIds)) next.delete(id);
            return next;
          });
          // Refresh scenario to update signed URLs
          await onRefetchScenario();
        }

        // Add any reported PENDING to pending set
        const pendingIds = items.filter(i => i.status === "PENDING").map(i => i.voice_line_id);
        if (pendingIds.length > 0) {
          setPending((prev) => {
            const next = new Set(prev);
            pendingIds.forEach(id => next.add(id));
            return next;
          });
        }
      } catch (e) {
        // ignore transient
      }
    };

    const interval = setInterval(poll, pollInterval);
    void poll();
    return () => { cancelled = true; clearInterval(interval); };
  }, [scenario?.id, pending.size, summaryEtag, onRefetchScenario, pollInterval]);

  // One-time discovery on scenario change: find PENDING items via summary
  useEffect(() => {
    if (!scenario?.id) return;
    let cancelled = false;
    
    // Small delay to avoid duplicate request with initial polling
    const timer = setTimeout(async () => {
      try {
        const res = await fetchVoiceLinesSummary(scenario.id);
        if (cancelled) return;
        if (res.etag) setSummaryEtag(res.etag);
        const items = res.data?.items || [];
        const pendingIds = items.filter(i => i.status === "PENDING").map(i => i.voice_line_id);
        if (pendingIds.length) {
          setPending(new Set(pendingIds));
        } else {
          setPending(new Set());
        }
      } catch {
        // ignore
      }
    }, 100);
    
    return () => { 
      cancelled = true; 
      clearTimeout(timer);
    };
  }, [scenario?.id]);

  // Cleanup audio on unmount or scenario change
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
  }, [scenario?.id]);

  const stopPlayback = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
      audioRef.current = null;
    }
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
    setPlayingId(null);
    setLoadingId(null);
    setProgress(0);
    setIsPaused(false);
  };

  const handlePlayCard = (voiceLineId: number, url?: string | null) => {
    if (!url) {
      addToast({ title: "No audio", description: "This line has no audio yet.", color: "default", timeout: 1500 });
      return;
    }

    // If same card is active: stop playback instead of pausing
    if (audioRef.current && playingId === voiceLineId) {
      stopPlayback();
      return;
    }

    // New card: stop any existing playback
    if (playingId !== null && playingId !== voiceLineId) {
      stopPlayback();
    }

    setLoadingId(voiceLineId);

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setProgress(0));
    audio.addEventListener("canplay", () => setLoadingId((id) => (id === voiceLineId ? null : id)));
    audio.addEventListener("play", () => {
      setPlayingId(voiceLineId);
      setIsPaused(false);
      setLoadingId(null);
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
      addToast({ title: "Playback failed", description: "Could not play audio.", color: "danger", timeout: 2000 });
    });

    void audio.play().catch(() => {
      stopPlayback();
      addToast({ title: "Playback blocked", description: "User gesture required.", color: "warning", timeout: 2000 });
    });
  };

  return (
      <div className="flex flex-col gap-4">
        {typeOrder.map((t) => {
          const items = groupedVoiceLines[t] || [];
          if (!items.length) return null;
          return (
            <div key={t} className="mb-4">
              <div className="flex flex-row items-center justify-start w-full rounded-lg bg-primary-100 mb-2 p-2 border-1 border-primary-500 shadow-md ">
                <div className="text-small font-medium text-primary uppercase tracking-wide">
                  {typeDisplayName[t] || t}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {items.map((vl) => {
                  const isLoading = loadingId === vl.id;
                  const isActive = playingId === vl.id;
                  const url = scenario.voice_lines.find(x => x.id === vl.id)?.preferred_audio?.signed_url || null;
                  return (
                    <div
                      key={vl.id}
                      className={`relative inline-flex border-1 border-default-900 ${isActive ? "ring-1 ring-success bg-success-400 hover:bg-success-400" : ""}  bg-gradient-surface glass-card shadow-lg shadow rounded-medium p-3 cursor-pointer transition-colors ${
                        isLoading ? "bg-default-200 animate-pulse" : "bg-content1 hover:bg-default-100"
                      }`}
                      onClick={() => handlePlayCard(vl.id, url)}
                    >
                      {isActive && (
                        <div className="absolute inset-0 z-0 overflow-hidden rounded-medium pointer-events-none">
                          <div
                            className={`h-full bg-emerald-500/30 ${isPaused ? "opacity-60" : "opacity-90"}`}
                            style={{ width: `${Math.min(progress * 100, 100)}%` }}
                          />
                        </div>
                      )}

                      <div className="relative z-10">
                        <div className="flex items-start justify-end gap-2">
                          {/* We intentionally display type section above; no ID shown here */}
                        </div>
                        <div className="mt-1  whitespace-pre-wrap break-words">
                          {(vl.text || "")
                            .replace(/\[\[.*?\]\]/gi, "")
                            .replace(/\[(?!\*)([^[\]]*?)\]/g, "")
                          }
                        </div>

                        {isLoading && (
                          <div className="absolute inset-0 grid place-items-center bg-black/5 rounded-medium">
                            <Spinner size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
  );
}

