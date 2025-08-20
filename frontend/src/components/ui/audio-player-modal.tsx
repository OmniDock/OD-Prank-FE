import { useEffect, useRef, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button } from "@heroui/react";
import { PlayIcon, PauseIcon, StopIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import { VoiceVisualizer } from "@/components/ui/voice-visualizer";

interface AudioPlayerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title?: string;
  subtitle?: string;
  autoPlayOnOpen?: boolean;
}

export function AudioPlayerModal({ isOpen, onOpenChange, src, title, subtitle, autoPlayOnOpen = true }: AudioPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string>(src);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Try to resolve CORS-tainted signed URLs into same-origin blob URLs for WebAudio analysis
  useEffect(() => {
    let aborted = false;
    let objectUrl: string | null = null;
    setResolvedSrc(src);

    (async () => {
      try {
        const res = await fetch(src, { mode: "cors", credentials: "omit" });
        if (!res.ok) return;
        const blob = await res.blob();
        if (aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
      } catch {
        // Fall back to direct src
      }
    })();

    return () => {
      aborted = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setError("Failed to load audio");

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
  }, [src]);

  useEffect(() => {
    if (!isOpen) {
      stop();
      setError(null);
    } else if (autoPlayOnOpen) {
      const audio = audioRef.current;
      if (audio) {
        void audio.play().then(() => setIsPlaying(true)).catch(() => {
          // Autoplay may be blocked; user can press play
          setIsPlaying(false);
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    audio.volume = volume;
  }, [muted, volume]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  }

  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }

  function seek(nextTime: number) {
    const audio = audioRef.current;
    if (!audio) return;
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

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="text-base font-semibold">{title ?? "Audio Player"}</div>
          {subtitle && <div className="text-xs text-default-500">{subtitle}</div>}
        </ModalHeader>
        <ModalBody>
          <audio ref={audioRef} src={resolvedSrc} crossOrigin="anonymous" />
          {error && <div className="text-xs text-danger">{error}</div>}

          <VoiceVisualizer
            audioRef={audioRef}
            isActive={isPlaying}
            height={140}
            colors={["#22c55e", "#3b82f6"]}
            className="mt-1"
          />

          <div className="flex items-center gap-3">
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
              className="w-24"
              aria-label="Volume"
            />
            <div className="ml-auto text-xs text-default-500">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onOpenChange(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


