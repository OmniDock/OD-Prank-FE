import { useEffect, useRef, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button, Chip } from "@heroui/react";
import { PlayIcon, PauseIcon, StopIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ChevronLeftIcon, ChevronRightIcon, SpeakerWaveIcon as GenerateIcon } from "@heroicons/react/24/outline";
import { CircularTapeVisualizer } from "@/components/ui/circular-tape-visualizer";
import { generateSingleTTS, getAudioUrl } from "@/lib/api.tts";
import type { VoiceLine, Language } from "@/types/scenario";

interface AudioPlayerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  voiceLines: VoiceLine[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  scenarioTitle?: string;
  language?: Language;
  autoPlayOnOpen?: boolean;
  preferredVoiceId?: string | null;
}

export function AudioPlayerModal({ 
  isOpen, 
  onOpenChange, 
  voiceLines, 
  currentIndex, 
  onIndexChange, 
  scenarioTitle, 
  language, 
  autoPlayOnOpen = true,
  preferredVoiceId,
}: AudioPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [generating, setGenerating] = useState(false);

  const currentVoiceLine = voiceLines[currentIndex];

  // Immediately stop playback when switching voice lines
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, [currentIndex]);

  // Load audio for current voice line
  useEffect(() => {
    let aborted = false;
    let objectUrl: string | null = null;
    
    const loadAudio = async () => {
      if (!currentVoiceLine?.id) {
        setResolvedSrc(null);
        setError(null);
        return;
      }

      // Clear previous error
      setError(null);

      try {
        // Always try to fetch a fresh signed URL; backend will 404 if none exists
        const fresh = await getAudioUrl(currentVoiceLine.id, preferredVoiceId ?? undefined);
        const url = fresh?.signed_url;
        
        if (!url) {
          console.warn("No audio URL available for voice line", currentVoiceLine.id);
          setResolvedSrc(null);
          return;
        }

        console.log("Loading audio from URL:", url);
        setResolvedSrc(url);

        // Try to create blob URL for better WebAudio compatibility
        try {
          const res = await fetch(url, { mode: "cors", credentials: "omit" });
          if (res.ok) {
            const blob = await res.blob();
            if (!aborted) {
              objectUrl = URL.createObjectURL(blob);
              setResolvedSrc(objectUrl);
              console.log("Created blob URL for audio");
            }
          } else {
            console.warn("Failed to fetch audio blob, status:", res.status);
          }
        } catch (fetchErr) {
          console.warn("Failed to create blob URL, using direct URL:", fetchErr);
          // Fall back to direct URL - this is fine
        }
      } catch (err) {
        console.error("Failed to get audio URL:", err);
        // Backend returns 404 if not generated; show silent state
        setResolvedSrc(null);
      }
    };

    loadAudio();

    return () => {
      aborted = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentVoiceLine?.id, preferredVoiceId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !resolvedSrc) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = (e: Event) => {
      console.error("Audio error event:", e, "Audio src:", audio.src);
      const errorMsg = audio.error?.message || 'Unknown error';
      setError(`Failed to load audio: ${errorMsg}`);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    audio.muted = muted;
    audio.volume = volume;

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [resolvedSrc, muted, volume]);

  useEffect(() => {
    if (!isOpen) {
      stop();
      setError(null);
    } else if (autoPlayOnOpen && resolvedSrc) {
      const audio = audioRef.current;
      if (audio) {
        void audio.play().then(() => setIsPlaying(true)).catch(() => {
          // Autoplay may be blocked; user can press play
          setIsPlaying(false);
        });
      }
    }
  }, [isOpen, resolvedSrc, autoPlayOnOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    audio.volume = volume;
  }, [muted, volume]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !resolvedSrc) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Failed to play audio:", err);
        setError("Failed to play audio");
        setIsPlaying(false);
      });
    }
  }

  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }

  function seek(nextTime: number) {
    const audio = audioRef.current;
    if (!audio || !resolvedSrc) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function formatTime(t: number) {
    const m = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  function goToPrevious() {
    if (currentIndex > 0) {
      // Immediately stop current playback
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setError(null);
      onIndexChange(currentIndex - 1);
    }
  }

  function goToNext() {
    if (currentIndex < voiceLines.length - 1) {
      // Immediately stop current playback
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setError(null);
      onIndexChange(currentIndex + 1);
    }
  }

  async function generateAudio() {
    if (!currentVoiceLine || generating) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const result = await generateSingleTTS({
        voice_line_id: currentVoiceLine.id,
        language: language,
        voice_id: preferredVoiceId ?? undefined,
      });
      
      if (result.success && result.signed_url) {
        // Use the returned signed URL immediately
        setResolvedSrc(result.signed_url);
      } else {
        setError(result.error_message || "Failed to generate audio");
      }
    } catch (err) {
      setError("Failed to generate audio");
    } finally {
      setGenerating(false);
    }
  }

  const getVoiceLineTypeColor = (type: string) => {
    switch (type) {
      case "OPENING": return "success";
      case "QUESTION": return "primary";
      case "RESPONSE": return "secondary";
      case "CLOSING": return "warning";
      default: return "default";
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" hideCloseButton={true}>
      <ModalContent>
        <ModalHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-0">
            <div className="text-lg font-semibold tracking-tight">{scenarioTitle ?? "Voice Lines"}</div>
            <div className="text-xs text-default-500 mt-0.5">
              {currentIndex + 1} of {voiceLines.length} • {language}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="flat" 
              onPress={goToPrevious}
              isDisabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="flat" 
              onPress={goToNext}
              isDisabled={currentIndex === voiceLines.length - 1}
              aria-label="Next"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </ModalHeader>
        
        <ModalBody className="pt-2">
          {resolvedSrc && <audio ref={audioRef} src={resolvedSrc} crossOrigin="anonymous" />}
          {error && <div className="text-xs text-danger mb-4">{error}</div>}
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-default-400 mb-2">
              Debug: Voice Line ID {currentVoiceLine?.id}, 
              Has storage_url: {!!currentVoiceLine?.storage_url}, 
              Resolved src: {resolvedSrc ? 'Yes' : 'No'}
            </div>
          )}
          
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Text content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Chip 
                  size="sm" 
                  color={getVoiceLineTypeColor(currentVoiceLine?.type)}
                  variant="flat"
                >
                  {currentVoiceLine?.type}
                </Chip>
                <span className="text-sm text-default-500">#{currentVoiceLine?.order_index}</span>
              </div>
              
              <div className="bg-content2/30 rounded-large p-4">
                <h3 className="text-sm font-medium text-default-600 mb-2">Spoken Text</h3>
                <p className="text-default-900 leading-relaxed whitespace-pre-wrap">
                  {currentVoiceLine?.text}
                </p>
              </div>
              
              {/* Generate button */}
              {!currentVoiceLine?.storage_url && (
                <Button 
                  color="primary" 
                  onPress={generateAudio}
                  isLoading={generating}
                  startContent={<GenerateIcon className="h-4 w-4" />}
                  className="w-full"
                >
                  Generate Audio
                </Button>
              )}
            </div>
            
            {/* Right column: Audio visualizer and controls */}
            <div className="space-y-4">
              <CircularTapeVisualizer
                audioRef={audioRef}
                isActive={isPlaying}
                size={280}
                color="#ff7a00"
                glowColor="#ffb566"
                className="mx-auto"
              />
              
              {resolvedSrc ? (
                <>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full"
                  />
                  
                  <div className="flex items-center gap-3 rounded-medium bg-content2/60 px-3 py-2">
                    <Button size="sm" color="primary" onPress={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                      {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                    </Button>
                    <Button size="sm" variant="flat" onPress={stop} aria-label="Stop">
                      <StopIcon className="h-5 w-5" />
                    </Button>
                    <Button size="sm" variant="flat" onPress={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}>
                      {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
                    </Button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-20"
                      aria-label="Volume"
                    />
                    <div className="ml-auto text-xs text-default-500">
                      {formatTime(currentTime)} / {formatTime(duration || 0)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8 text-center">
                  <div className="text-default-500">
                    <p className="text-sm">No audio available for this voice line</p>
                    <p className="text-xs mt-1">Generate audio to hear this text spoken</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter className="justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="flat" 
              size="sm"
              onPress={goToPrevious}
              isDisabled={currentIndex === 0}
            >
              ← Previous
            </Button>
            <Button 
              variant="flat" 
              size="sm"
              onPress={goToNext}
              isDisabled={currentIndex === voiceLines.length - 1}
            >
              Next →
            </Button>
          </div>
          <Button variant="light" onPress={() => onOpenChange(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


