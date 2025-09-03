import { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  UserIcon
} from "@heroicons/react/24/solid";
import { Tabs, Tab } from "@heroui/tabs";
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/v1/tts/voices`, {
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
            Showing {showAll ? filteredVoices.length : Math.min(maxVoices, filteredVoices.length)} of {filteredVoices.length} voices
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
          <Tab key="all" title="All Genders" />
          <Tab key="MALE" title="Male" />
          <Tab key="FEMALE" title="Female" />
        </Tabs>
        
        {/* Language Filter */}
        <Tabs
          selectedKey={selectedLanguage}
          onSelectionChange={(key) => setSelectedLanguage(key as string)}
          size="sm"
          color="primary"
          variant="solid"
        >
          <Tab key="all" title="All Languages" />
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
          <p className="text-default-500">No voices match your filters</p>
          <p className="text-sm text-default-400 mt-2">Try adjusting your selection</p>
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
              delay: index * 0.08,
              ease: "easeOut"
            }}
          >
              <Card className="hover:shadow-lg transition-shadow duration-300 border-default-100 h-full">
                <CardBody className="p-6 flex flex-col h-full">
                  {/* Voice Header */}
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
                                <span className="text-lg">{getLanguageFlag(lang)}</span>
                              ))}
                          </div>
                        </div>
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
                  <p className="text-sm text-default-500 mb-4 line-clamp-2 flex-grow">
                    {voice.description || "Professional voice actor"}
                  </p>



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
        
        {/* Additional cards that animate in/out */}
        <AnimatePresence>
          {showAll && filteredVoices.slice(maxVoices).map((voice, index) => (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{ 
                opacity: 0,
                y: 20,
                scale: 0.95
              }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
            <Card className="hover:shadow-lg hover:scale-110 transition-shadow transition-all duration-300 border-default-100 h-full">
              <CardBody className="p-6 flex flex-col h-full">
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
                <p className="text-sm text-default-500 mb-4 line-clamp-2 flex-grow">
                  {voice.description || "Professional voice actor"}
                </p>

                {/* Languages */}
                <div className="flex gap-2 flex-wrap mt-auto">
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
                Show Less
                <ChevronUpIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                Show {filteredVoices.length - maxVoices} More Voices
                <ChevronDownIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
