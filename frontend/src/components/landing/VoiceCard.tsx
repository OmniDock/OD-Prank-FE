import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import { PauseIcon, PlayIcon, SpeakerWaveIcon, UserIcon } from "@heroicons/react/24/solid";

export interface Voice {
  id: string;
  name: string;
  description: string;
  languages: string[];
  gender: string;
  preview_url: string;
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
  showPlayingIndicator = true,
  className = "",
}: VoiceCardProps) {
  return (
    <Card className={`shadow-lg hover:scale-110 transition-transform duration-300 transform-gpu border-default-100 h-full bg-gradient-surface glass-card ${className}`}>
      <CardBody className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-${getGenderColor(voice.gender)}-100 dark:bg-${getGenderColor(voice.gender)}-900/30`}>
              <UserIcon className={`w-5 h-5 text-${getGenderColor(voice.gender)}`} />
            </div>
            <div>
              <div className="flex flex-row items-center gap-2 justify-center">
                <h3 className="text-lg font-semibold">{voice.name}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {voice.languages.map((lang) => (
                      <span key={lang} className="text-lg">
                        {getLanguageFlag(lang)}
                      </span>
                    ))}
                  </div>
              </div>
              <Chip size="sm" color={getGenderColor(voice.gender)} variant="flat">
                {voice.gender.toLowerCase()}
              </Chip>
            </div>
          </div>

          <Button
            isIconOnly
            size="lg"
            color={isPlaying ? "success" : "primary"}
            variant={isPlaying ? "flat" : "light"}
            onClick={() => onTogglePlay(voice)}
            className="transition-all"
          >
            {isPlaying ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <PauseIcon className="w-5 h-5" />
              </motion.div>
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </Button>
        </div>

        <p className="text-sm text-default-500 mb-4 line-clamp-2 flex-grow">
          {voice.description || "Professional voice actor"}
        </p>

        {showPlayingIndicator && isPlaying && (
          <motion.div className="mt-4 flex items-center gap-2 text-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SpeakerWaveIcon className="w-4 h-4" />
            <span className="text-xs">Playing preview...</span>
          </motion.div>
        )}
      </CardBody>
    </Card>
  );
}


