import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";
import { fetchScenario, updateScenarioPreferredVoice } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import { fetchVoices } from "@/lib/api.tts";
import { AudioPlayerModal } from "@/components/ui/audio-player-modal";
import { ScenarioInfo } from "@/components/ui/scenario-info";
import { VoiceSection } from "@/components/ui/voice-section";
import { VoiceLinesTable } from "@/components/ui/voice-lines-table";
import type { VoiceItem } from "@/types/tts";
import { motion } from "framer-motion";

export default function ScenarioDetailPage() {
  const { id } = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerCurrentIndex, setPlayerCurrentIndex] = useState(0);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  


  const refetchScenario = async () => {
    if (!id) return;
    try {
      const data = await fetchScenario(id);
      setScenario(data);
    } catch (error) {
      console.error('Failed to refetch scenario:', error);
    }
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await fetchScenario(id);
        console.log('Scenario loaded:', data);
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

  function onOpenPlayer(voiceLineId: number) {
    if (!scenario || !scenario.preferred_voice_id) {
      addToast({ title: "No voice selected", description: "Select a voice first to play audio.", color: "warning", timeout: 3000 });
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
        title: "Preferred voice updated",
        description: `${voices.find(v=>v.id===voiceId)?.name ?? voiceId} will be used for this scenario`,
        color: "success",
        timeout: 3000,
      });
    } catch (e) {
      addToast({
        title: "Update failed",
        description: "Failed to set preferred voice",
        color: "danger",
        timeout: 5000,
      });
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
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
          <h1 className="text-2xl font-semibold">{scenario.title}</h1>
          <Chip color={scenario.is_safe ? "success" : "danger"} variant="flat">
            {scenario.is_safe ? "Safe" : "Unsafe"}
          </Chip>
      </div>

      <ScenarioInfo scenario={scenario} onRefresh={refetchScenario} />


      <VoiceSection 
        scenario={scenario}
        voices={voices}
        onSelect={(id) => void persistPreferredVoice(id)}
      />

      {!scenario.is_safe && scenario.is_not_safe_reason && (
        <Card>
          <CardBody>
            <div className="text-sm">Not safe because: {scenario.is_not_safe_reason}</div>
          </CardBody>
        </Card>
      )}

      <VoiceLinesTable 
        scenario={scenario}
        onRefetchScenario={refetchScenario}
        onOpenPlayer={onOpenPlayer}
      />


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


