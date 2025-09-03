import { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon,
  UserIcon,
  SparklesIcon
} from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabaseClient";

interface Voice {
  id: string;
  name: string;
  description: string;
  languages: string[];
  gender: string;
  preview_url: string;
}

interface VoiceShowcaseProps {
  title?: string;
  subtitle?: string;
  maxVoices?: number;
}

export default function VoiceShowcase({ 
  title = "Meet Some of Our Voice Actors",
  subtitle = "Professional voices that bring your pranks to life",
  maxVoices = 6
}: VoiceShowcaseProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchVoices();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const fetchVoices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/v1/tts/voices`, {
        headers: session ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        // Limit to maxVoices for showcase
        setVoices(data.voices.slice(0, maxVoices));
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = (voice: Voice) => {
    if (playingId === voice.id) {
      // Pause current
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play new audio
      audioRef.current = new Audio(voice.preview_url);
      audioRef.current.play();
      setPlayingId(voice.id);
      
      // Reset when audio ends
      audioRef.current.onended = () => {
        setPlayingId(null);
      };
    }
  };

  const getGenderColor = (gender: string) => {
    return gender === 'FEMALE' ? 'secondary' : 'primary';
  };

  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      'GERMAN': '🇩🇪',
      'ENGLISH': '🇬🇧',
      'SPANISH': '🇪🇸',
      'FRENCH': '🇫🇷',
      'ITALIAN': '🇮🇹'
    };
    return flags[language] || '🌍';
  };

  if (loading) {
    return (
      <div className="w-full py-12">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <SpeakerWaveIcon className="w-8 h-8 text-primary" />
          </motion.div>
          <p className="text-default-500 mt-2">Loading voices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header - matching TemplateContainer style */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-gradient">{title}</span>
        </h2>
        <p className="text-lg text-default-600 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {voices.map((voice, index) => (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300 border-default-100">
                <CardBody className="p-6">
                  {/* Voice Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-${getGenderColor(voice.gender)}-100 dark:bg-${getGenderColor(voice.gender)}-900/30`}>
                        <UserIcon className={`w-5 h-5 text-${getGenderColor(voice.gender)}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{voice.name}</h3>
                        <Chip 
                          size="sm" 
                          color={getGenderColor(voice.gender)}
                          variant="flat"
                        >
                          {voice.gender.toLowerCase()}
                        </Chip>
                      </div>
                    </div>
                    
                    {/* Play Button */}
                    <Button
                      isIconOnly
                      size="lg"
                      color={playingId === voice.id ? "success" : "primary"}
                      variant={playingId === voice.id ? "flat" : "light"}
                      onClick={() => handlePlayPause(voice)}
                      className="transition-all"
                    >
                      {playingId === voice.id ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <PauseIcon className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <PlayIcon className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-default-500 mb-4 line-clamp-2">
                    {voice.description || "Professional voice actor"}
                  </p>

                  {/* Languages */}
                  <div className="flex gap-2 flex-wrap">
                    {voice.languages.map((lang) => (
                      <Chip
                        key={lang}
                        size="sm"
                        variant="flat"
                        startContent={<span className="text-lg">{getLanguageFlag(lang)}</span>}
                      >
                        {lang.toLowerCase()}
                      </Chip>
                    ))}
                  </div>

                  {/* Playing Indicator */}
                  {playingId === voice.id && (
                    <motion.div
                      className="mt-4 flex items-center gap-2 text-success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <SpeakerWaveIcon className="w-4 h-4" />
                      <span className="text-xs">Playing preview...</span>
                    </motion.div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Button - matching TemplateContainer style */}
      {voices.length === maxVoices && (
        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-full bg-gradient-primary text-white font-semibold hover:scale-105 transition-transform">
            Explore All Voices
          </button>
        </div>
      )}
    </div>
  );
}
