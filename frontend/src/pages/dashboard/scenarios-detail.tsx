import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  addToast,
} from "@heroui/react";
import { fetchScenario, updateScenarioPreferredVoice } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import { fetchVoices, generateScenarioTTS } from "@/lib/api.tts";
import { getCredits } from "@/lib/api.profile";
import { AudioPlayerModal } from "@/components/ui/audio-player-modal";
import { ScenarioInfo } from "@/components/ui/scenario-info";
import { VoiceSection } from "@/components/ui/voice-section";
import { VoiceLinesTable } from "@/components/ui/voice-lines-table";
import { VoiceGenerationStatus } from "@/components/ui/voice-generation-status";
import type { VoiceItem } from "@/types/tts";
import { motion } from "framer-motion";
import { CallStartBox } from "@/components/ui/call-start-box";
import LoadingScreen from '@/components/LoadingScreen';

export default function ScenarioDetailPage() {
  const { id } = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerCurrentIndex, setPlayerCurrentIndex] = useState(0);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [tableKey, setTableKey] = useState(0);
  const [callCredits, setCallCredits] = useState<number | null>(null);
  
  const preferredVoice = useMemo(() => 
    voices.find(v => v.id === scenario?.preferred_voice_id) || null,
    [voices, scenario?.preferred_voice_id]
  );

  const allAudiosReady = useMemo(() => 
    scenario?.voice_lines.every(vl => vl.preferred_audio?.signed_url) || false,
    [scenario?.voice_lines]
  );

  const refetchScenario = async () => {
    if (!id) return;
    try {
      const data = await fetchScenario(id);
      setScenario(data);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Szenarios:', error);
    }
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await fetchScenario(id);
        console.log('Szenario geladen:', data);
        setScenario(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchVoices();
        setVoices(res.voices || []);
      } catch {
        // noop
      }
    })();
  }, []);

  useEffect(() => {
    const fetchCallCredits = async () => {
      try {
        const creditsData = await getCredits();
        setCallCredits(creditsData.call_credit_amount || 0);
      } catch (error) {
        console.error('Failed to fetch call credits:', error);
        setCallCredits(0);
      }
    };

    fetchCallCredits();
  }, []);

  function onOpenPlayer(voiceLineId: number) {
    if (!scenario || !scenario.preferred_voice_id) {
      addToast({ title: "Keine Stimme ausgewählt", description: "Wähle eine Stimme, um Audio abzuspielen.", color: "warning", timeout: 3000 });
        return;
      }

    const index = scenario.voice_lines.findIndex(vl => vl.id === voiceLineId);
    if (index === -1) return;
    setPlayerCurrentIndex(index);
    setIsPlayerOpen(true);
  }

  



  async function persistPreferredVoice(voiceId: string) {
    if (!scenario) return;
    try {
      await updateScenarioPreferredVoice(scenario.id, voiceId);
      // Refetch scenario to get updated audio availability
      await refetchScenario();
      addToast({
        title: "Bevorzugte Stimme aktualisiert",
        description: `${voices.find(v=>v.id===voiceId)?.name ?? voiceId} wird für dieses Szenario verwendet`,
        color: "success",
        timeout: 3000,
      });
      // Trigger bulk TTS generation for all voice lines
      void generateScenarioTTS({ scenario_id: scenario.id, voice_id: voiceId })
        .then((res) => {
          addToast({
            title: "Generation gestartet",
            description: `Audio-Generation für ${res.total_processed ?? "alle"} Zeilen gestartet`,
            color: "primary",
            timeout: 2500,
          });
          // Remount table to re-run its summary discovery
          setTableKey((k) => k + 1);
        })
        .catch(() => {
          addToast({
            title: "Generation fehlgeschlagen",
            description: "Konnte die Audio-Generation für dieses Szenario nicht starten.",
            color: "danger",
            timeout: 4000,
          });
        });
    } catch (e) {
      addToast({
        title: "Update fehlgeschlagen",
        description: "Konnte die bevorzugte Stimme nicht setzen",
        color: "danger",
        timeout: 5000,
      });
    }
  }



  if (loading) {
    return (
      <LoadingScreen message="Szenario wird geladen..." />
    );
  }
  if (!scenario) return null;

  return (
    <motion.section
      className="py-4 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >

      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Titel: {scenario.title}</h1>
          {/* <Chip color={scenario.is_safe ? "success" : "danger"} variant="flat">
            {scenario.is_safe ? "Safe" : "Unsafe"}
          </Chip> */}
          <div></div>
      </div>

      <ScenarioInfo scenario={scenario} onRefresh={refetchScenario} />

      {!scenario.is_safe && scenario.is_not_safe_reason && (
        <Card>
          <CardBody>
            <div className="text-sm">Nicht sicher, weil: {scenario.is_not_safe_reason}</div>
          </CardBody>
        </Card>
      )}

      {scenario.is_safe && ! scenario.preferred_voice_id && (
      <VoiceSection 
        scenario={scenario}
        voices={voices}
        onSelect={(id) => void persistPreferredVoice(id)}
      />
      )}

      {/* Green Call Box between details and voice lines */}
      {scenario.is_safe && scenario.preferred_voice_id && allAudiosReady && (
        <CallStartBox scenario={scenario} callCredits={callCredits} preferredVoice={preferredVoice} />
      )}

      {/* {scenario.preferred_voice_id && ( */}
        <>
          <VoiceGenerationStatus scenarioId={scenario.id} totalCount={scenario.voice_lines.length} />
          <VoiceLinesTable 
            key={tableKey}
            scenario={scenario}
            onRefetchScenario={refetchScenario}
            onOpenPlayer={onOpenPlayer}
          />
          
        </>
      {/* )} */}


      {scenario && (
        <AudioPlayerModal
          isOpen={isPlayerOpen}
          onOpenChange={setIsPlayerOpen}
          voiceLines={scenario.voice_lines}
          currentIndex={playerCurrentIndex}
          onIndexChange={setPlayerCurrentIndex}
          scenarioTitle={scenario.title}
          language={scenario.language}
          autoPlayOnOpen
          preferredVoiceId={scenario.preferred_voice_id ?? null}
        />
      )}

      


    </motion.section>
  );
}


