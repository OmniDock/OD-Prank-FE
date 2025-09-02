import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button, Input, Chip } from "@heroui/react";
import { PlayIcon, PauseIcon, StopIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import type { VoiceItem } from "@/types/tts";
import { CircularTapeVisualizer } from "@/components/ui/circular-tape-visualizer";

interface VoicePickerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  voices: VoiceItem[];
  selectedVoiceId?: string | null;
  onSelect: (voiceId: string) => Promise<void> | void;
}

export function VoicePickerModal({ isOpen, onOpenChange, voices, selectedVoiceId, onSelect }: VoicePickerModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [genderFilter, setGenderFilter] = useState<"ALL" | "MALE" | "FEMALE">("ALL");
  const [languageFilter, setLanguageFilter] = useState<"ALL" | "GERMAN" | "ENGLISH">("ALL");

  // Fixed language group (German/English)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

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

  // Apply volume and mute settings when they change
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = muted;
    }
  }, [volume, muted]);

  // Reset audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(false);
      setPreviewingId(null);
    }
  }, [isOpen]);

  // Play audio for a specific voice
  function handlePlay(voice: VoiceItem) {
    if (!voice.preview_url) return;
    const audio = audioRef.current;
    if (!audio) return;
    
    // Toggle behavior if already playing this voice
    if (previewingId === voice.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    
    // Load new source if needed
    if (audio.src !== voice.preview_url) {
      audio.src = voice.preview_url;
    }
    
    // Play the audio
    void audio.play().then(() => {
      setPreviewingId(voice.id);
      setIsPlaying(true);
    }).catch(() => setIsPlaying(false));
  }
  
  // Stop audio playback and reset position
  function handleStop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }

  // Reset to start when ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      audio.currentTime = 0;
      setIsPlaying(false);
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" scrollBehavior="inside" hideCloseButton={true}>
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <div className="text-lg font-semibold">Choose a voice</div>
        </ModalHeader>
        <ModalBody>
          <audio ref={audioRef} crossOrigin="anonymous" />
          
          {/* Main two-column layout - actor list on left, single visualizer on right */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
            {/* Left column: Voice list with search/filters */}
            <div className="space-y-4">
              <div className="mb-3">
                <Input
                  size="sm"
                  placeholder="Search by name, id, description, language…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              {/* Filters below search */}
              <div className="flex items-center justify-center gap-12 flex-wrap mb-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={genderFilter === "MALE" ? "solid" : "flat"} color={genderFilter === "MALE" ? "primary" : "default"} onPress={() => setGenderFilter(genderFilter === "MALE" ? "ALL" : "MALE")}>Male</Button>
                  <Button size="sm" variant={genderFilter === "FEMALE" ? "solid" : "flat"} color={genderFilter === "FEMALE" ? "primary" : "default"} onPress={() => setGenderFilter(genderFilter === "FEMALE" ? "ALL" : "FEMALE")}>Female</Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant={languageFilter === "GERMAN" ? "solid" : "flat"} color={languageFilter === "GERMAN" ? "primary" : "default"}  onPress={() => setLanguageFilter(languageFilter === "GERMAN" ? "ALL" : "GERMAN")}>German</Button>
                  <Button size="sm" variant={languageFilter === "ENGLISH" ? "solid" : "flat"} color={languageFilter === "ENGLISH" ? "primary" : "default"}  onPress={() => setLanguageFilter(languageFilter === "ENGLISH" ? "ALL" : "ENGLISH")}>English</Button>
                </div>
              </div>
              
              <hr className="border-default-200"/>
              
              {/* Voice actors list */}
              <div className="flex flex-col  gap-3 overflow-y-auto max-h-[400px]">
                {filtered.map((v) => (
                  <div 
                    key={v.id} 
                    className={`py-3 px-2 flex items-center justify-between hover:bg-content2/20 cursor-pointer shadow-md m-1 rounded-md ${selectedVoiceId === v.id ? "bg-content2/30 rounded-md" : ""} ${previewingId === v.id ? "ring-2 ring-primary ring-inset rounded-md" : ""}`}
                    onClick={() => {
                      // Stop audio if we're switching to a different voice
                      if (previewingId && previewingId !== v.id && isPlaying) {
                        handleStop();
                      }
                      setPreviewingId(v.id);
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-default-900">{v.name}</div>
                        <Chip size="sm" variant="flat">{v.gender}</Chip>
                        {v.languages.map((lng) => (
                          <Chip key={`${v.id}-${lng}`} size="sm" variant="flat">{lng}</Chip>
                        ))}
                      </div>
                      {v.description && (
                        <p className="text-xs text-default-500 mt-1">{v.description}</p>
                      )}
                    </div>
                    {selectedVoiceId === v.id && (
                      <Chip size="sm" color="primary" variant="flat">Selected</Chip>
                    )}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-sm text-default-500">No voices match your filters.</div>
                )}
              </div>
            </div>
            
            {/* Right column: Single Audio visualizer */}
            <div className="flex flex-col items-center justify-center gap-4 bg-content2/20 rounded-xl p-6">
              <h3 className="text-md font-medium text-default-700">
                {previewingId ? 
                  `${voices.find(v => v.id === previewingId)?.name || previewingId}` : 
                  "Click on a voice from the list"}
              </h3>
              
              <CircularTapeVisualizer
                audioRef={audioRef}
                isActive={!!previewingId && isPlaying}
                size={240}
                color="#ff7a00"
                glowColor="#ffb566"
                padding={12}
                className="mx-auto"
              />
              
              <div className="flex flex-col gap-3 w-full">
                {/* Audio controls */}
                <div className="flex items-center gap-2 justify-center rounded-medium bg-content2/60 px-3 py-2 mb-1">
                  <Button 
                    size="sm" 
                    color="primary"
                    isDisabled={!previewingId}
                    isIconOnly
                    onPress={() => {
                      if (previewingId) {
                        const voice = voices.find(v => v.id === previewingId);
                        if (voice) handlePlay(voice);
                      }
                    }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="flat" 
                    isDisabled={!previewingId || !isPlaying}
                    isIconOnly
                    onPress={handleStop}
                    aria-label="Stop"
                  >
                    <StopIcon className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="flat"
                    isDisabled={!previewingId} 
                    isIconOnly
                    onPress={() => setMuted(m => !m)}
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
                  </Button>
                  
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-28"
                    aria-label="Volume"
                    disabled={!previewingId}
                  />
                </div>
                {/* Single select button for the previewed voice */}
                <Button 
                  size="sm" 
                  color="warning"
                  className="w-full mt-1"
                  variant={selectedVoiceId === previewingId ? "flat" : "solid"}
                  isDisabled={!previewingId || selectedVoiceId === previewingId}
                  onPress={() => {
                    if (!previewingId) return;
                    if (isPlaying) handleStop();
                    void Promise.resolve(onSelect(previewingId));
                  }}
                >
                  {selectedVoiceId === previewingId ? "Selected" : "Select"}
                </Button>

              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex flex-start w-full flex-row justify-start">
            <Button variant="light" size="sm" onPress={() => onOpenChange(false)}>Close</Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


