import { useState, useEffect, useRef } from "react";
import VoiceCard, { type Voice as VoiceType } from "@/components/landing/VoiceCard";
import { motion, AnimatePresence } from "framer-motion";
import { SpeakerWaveIcon, ChevronDownIcon, ChevronUpIcon, FunnelIcon } from "@heroicons/react/24/solid";
import { Tabs, Tab } from "@heroui/tabs";
import { supabase } from "@/lib/supabaseClient";

type Voice = VoiceType;

interface VoiceShowcaseProps {
  title?: string;
  subtitle?: string;
  maxVoices?: number;
}

export default function VoiceShowcase({ 
  title = "Lerne einige unserer Stimmen kennen",
  subtitle = "Professionelle Stimmen aus aller Welt, bereit, deine Streiche zum Leben zu erwecken",
  maxVoices = 6
}: VoiceShowcaseProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
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
      const apiUrl = import.meta.env.VITE_BACKEND_URL;
      
      const response = await fetch(`${apiUrl}/tts/voices`, {
        headers: session ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store all voices
        setVoices(data.voices);
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

  // helpers moved to VoiceCard
  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      GERMAN: "🇩🇪",
      ENGLISH: "🇬🇧",
      SPANISH: "🇪🇸",
      FRENCH: "🇫🇷",
      ITALIAN: "🇮🇹",
    };
    return flags[language] || "🌍";
  };
  
  // Filter voices based on selected criteria
  const filteredVoices = voices.filter(voice => {
    const genderMatch = selectedGender === 'all' || voice.gender === selectedGender;
    const languageMatch = selectedLanguage === 'all' || voice.languages.includes(selectedLanguage);
    return genderMatch && languageMatch;
  });
  
  // Get unique languages from all voices
  const availableLanguages = Array.from(new Set(voices.flatMap(v => v.languages)));

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
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-gradient">{title}</span>
        </h2>
        <p className="text-lg text-default-600 max-w-2xl mx-auto">
          {subtitle}
        </p>
        {filteredVoices.length > 0 && (
          <p className="text-sm text-default-400 mt-2">
            Anzeigen {showAll ? filteredVoices.length : Math.min(maxVoices, filteredVoices.length)} von {filteredVoices.length} Stimmen
            {selectedGender !== 'all' && ` • ${selectedGender.toLowerCase()}`}
            {selectedLanguage !== 'all' && ` • ${selectedLanguage.toLowerCase()}`}
          </p>
        )}
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Gender Filter */}
        <Tabs 
          selectedKey={selectedGender}
          onSelectionChange={(key) => setSelectedGender(key as string)}
          size="sm"
          color="primary"
          variant="solid"
        >
          <Tab key="all" title="Alle Geschlechter" />
          <Tab key="MALE" title="Männlich" />
          <Tab key="FEMALE" title="Weiblich" />
        </Tabs>
        
        {/* Language Filter */}
        <Tabs
          selectedKey={selectedLanguage}
          onSelectionChange={(key) => setSelectedLanguage(key as string)}
          size="sm"
          color="primary"
          variant="solid"
        >
          <Tab key="all" title="Alle Sprachen" />
          {availableLanguages.map(lang => (
            <Tab 
              key={lang}
              title={
                <div className="flex items-center gap-1">
                  <span>{getLanguageFlag(lang)}</span>
                  <span>{lang.charAt(0) + lang.slice(1).toLowerCase()}</span>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* No results message */}
      {filteredVoices.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-default-100 mb-4">
            <FunnelIcon className="w-8 h-8 text-default-400" />
          </div>
          <p className="text-default-500">Keine Stimmen passen zu deinen Filtern</p>
          <p className="text-sm text-default-400 mt-2">Versuche, deine Auswahl anzupassen</p>
        </div>
      )}
      
      {/* Voice Cards Grid */}
      {filteredVoices.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Always visible cards */}
        {filteredVoices.slice(0, maxVoices).map((voice, index) => (
          <motion.div
            key={voice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              delay: index * 0.06,
              ease: "easeOut"
            }}
          >
            <VoiceCard
              voice={voice}
              isPlaying={playingId === voice.id}
              onTogglePlay={handlePlayPause}
            />
          </motion.div>
        ))}
        
        {/* Additional cards that animate in/out */}
        <AnimatePresence>
          {showAll && filteredVoices.slice(maxVoices).map((voice, index) => (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
            >
              <VoiceCard
                voice={voice}
                isPlaying={playingId === voice.id}
                onTogglePlay={handlePlayPause}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}

      {/* Show More/Less Button - matching TemplateContainer style */}
      {filteredVoices.length > maxVoices && (
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button 
            onClick={() => setShowAll(!showAll)}
            className="px-8 py-3 rounded-full bg-gradient-primary text-white font-semibold hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            {showAll ? (
              <>
                Weniger anzeigen
                <ChevronUpIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                Mehr anzeigen {filteredVoices.length - maxVoices}
                <ChevronDownIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
