import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import { labelGender } from "@/lib/i18n";
import { PauseIcon, PlayIcon, UserIcon } from "@heroicons/react/24/solid";

export interface Voice {
  id: string;
  name: string;
  description: string;
  languages: string[];
  gender: string;
  preview_url: string;
  avatar_url: string;
}

function getGenderColor(gender: string): "primary" | "secondary" {
  return gender === "FEMALE" ? "secondary" : "primary";
}

function getLanguageFlag(language: string): string {
  const flags: Record<string, string> = {
    GERMAN: "🇩🇪",
    ENGLISH: "🇬🇧",
    SPANISH: "🇪🇸",
    FRENCH: "🇫🇷",
    ITALIAN: "🇮🇹",
  };
  return flags[language] || "🌍";
}

interface VoiceCardProps {
  voice: Voice;
  isPlaying: boolean;
  onTogglePlay: (voice: Voice) => void;
  showLanguageFlagsInline?: boolean;
  showLanguageChips?: boolean;
  showPlayingIndicator?: boolean;
  className?: string;
}

export default function VoiceCard({
  voice,
  isPlaying,
  onTogglePlay,
  className = "",
}: VoiceCardProps) {
  return (
    <Card className={`group relative overflow-visible shadow-lg hover:scale-105 transition-transform duration-300 transform-gpu border-default-100 h-full rounded-3xl bg-gradient-to-br from-pink-50 via-white to-sky-50 dark:from-default-50/10 dark:via-default-50/5 dark:to-default-50/10 glass-card ${className}`}>

      <CardBody className="p-6">
        <div className="flex items-start gap-5">
          <motion.div
            className="relative w-28 h-28 md:w-32 md:h-32 shrink-0"
            animate={!isPlaying ? { y: [0, -3, 0] } : {}}
            transition={!isPlaying ? { duration: 3, repeat: Infinity } : {}}
          >
            
            {isPlaying && (
              <span className="absolute -inset-2 rounded-full bg-success/30 animate-ping" />
            )}
            

            <div className="absolute -right-2 top-1 z-20 bg-white/90 text-default-700 text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-default-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Hi! 👋
            </div>

            <div className="relative z-10 w-full h-full rounded-full overflow-hidden ring-4 ring-white/80 shadow-xl bg-white flex items-center justify-center">
              {voice.avatar_url ? (
                <img
                  src={voice.avatar_url}
                  alt={voice.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className={`w-16 h-16 text-${getGenderColor(voice.gender)}`} />
              )}
            </div>

            {/* Floating Play/Pause button over avatar to save space */}
            <Button
              isIconOnly
              size="lg"
              color={isPlaying ? "success" : "primary"}
              variant={isPlaying ? "flat" : "light"}
              onClick={() => onTogglePlay(voice)}
              className="absolute -bottom-2 -right-2 z-30 transition-all rounded-full bg-white/70 backdrop-blur border border-default-200 shadow-lg"
            >
              {isPlaying ? (
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <PauseIcon className="w-6 h-6" />
                </motion.div>
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </Button>
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <div className="flex flex-row items-center gap-2">
                  <h3 className="text-xl md:text-2xl font-extrabold tracking-tight truncate">
                    {voice.name}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {voice.languages.map((lang) => (
                      <span key={lang} className="text-lg">
                        {getLanguageFlag(lang)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-1">
                  <Chip size="sm" color={getGenderColor(voice.gender)} variant="flat" className="rounded-full">
                    {labelGender(voice.gender as any)}
                  </Chip>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm md:text-base leading-snug text-default-700 bg-white/70 dark:bg-default-50/10 rounded-2xl px-3 py-2 border border-default-200/60 line-clamp-2 sm:line-clamp-3 md:line-clamp-4">
              {voice.description || "Professional voice actor"}
            </p>

            {/* {showPlayingIndicator && isPlaying && (
              <div className="mt-4 h-5 flex items-end gap-1">
                <motion.span
                  className="w-1.5 rounded-full bg-success"
                  animate={{ height: [6, 16, 8, 14, 6] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.span
                  className="w-1.5 rounded-full bg-success/90"
                  animate={{ height: [10, 6, 18, 8, 10] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.span
                  className="w-1.5 rounded-full bg-success/80"
                  animate={{ height: [8, 14, 6, 16, 8] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
                <motion.span
                  className="w-1.5 rounded-full bg-success/70"
                  animate={{ height: [14, 8, 12, 6, 14] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
              </div>
            )} */}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}


