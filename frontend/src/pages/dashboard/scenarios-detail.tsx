import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  addToast,
} from "@heroui/react";
import { enhanceVoiceLines, fetchScenario, updateScenarioPreferredVoice } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import { fetchVoices } from "@/lib/api.tts";
import { AudioPlayerModal } from "@/components/ui/audio-player-modal";
import { VoicePickerModal } from "@/components/ui/voice-picker-modal";
import { ScenarioInfo } from "@/components/ui/scenario-info";
import { VoiceSettings } from "@/components/ui/voice-settings";
import { VoiceLinesTable } from "@/components/ui/voice-lines-table";
import type { VoiceItem } from "@/types/tts";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ScenarioDetailPage() {
  const { id } = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isEnhanceOpen, setIsEnhanceOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerCurrentIndex, setPlayerCurrentIndex] = useState(0);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);


  const refetchScenario = async () => {
    if (!id) return;
    try {
      const data = await fetchScenario(id);
      console.log('Scenario refetched:', data);
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

  async function onEnhance() {
    if (!scenario || selected.size === 0 || enhancing) return;
    setEnhancing(true);
    try {
      const res = await enhanceVoiceLines({
        voice_line_ids: Array.from(selected),
        user_feedback: feedback,
      });
      if (res.success) {
        // Refetch the complete scenario data to update audio availability
        await refetchScenario();
        
        const successCount = res.successful_enhancements.length;
        const failedCount = res.failed_enhancements?.length || 0;
        
        if (successCount > 0) {
          addToast({
            title: "Enhancement completed",
            description: `Successfully enhanced ${successCount} voice line(s). Audio files have been cleared - regenerate as needed.`,
            color: "success",
            timeout: 5000,
          });
        }
        
        if (failedCount > 0) {
          addToast({
            title: "Some enhancements failed",
            description: `${failedCount} voice line(s) could not be enhanced. Check the logs for details.`,
            color: "warning",
            timeout: 5000,
          });
        }
      } else {
        addToast({
          title: "Enhancement failed",
          description: "Failed to enhance voice lines. Please try again.",
          color: "danger",
          timeout: 5000,
        });
      }
      setIsEnhanceOpen(false);
      setSelected(new Set());
      setFeedback("");
    } catch (error) {
      console.error('Enhancement error:', error);
      addToast({
        title: "Enhancement failed",
        description: "An unexpected error occurred. Please try again.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setEnhancing(false);
    }
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
    <section className="py-4 space-y-4">
      <Breadcrumbs>
        <BreadcrumbItem href="/dashboard/scenarios">Scenarios</BreadcrumbItem>
        <BreadcrumbItem>{scenario.title}</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{scenario.title}</h1>

        </div>
        <Chip color={scenario.is_safe ? "success" : "danger"} variant="flat">
          {scenario.is_safe ? "Safe" : "Unsafe"}
        </Chip>
      </div>

      <ScenarioInfo scenario={scenario} />

      <VoiceSettings 
        scenario={scenario}
        voices={voices}
        onOpenVoicePicker={() => setIsVoicePickerOpen(true)}
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
        selected={selected}
        onSelectionChange={setSelected}
        onOpenPlayer={onOpenPlayer}
        onEnhanceSelected={() => setIsEnhanceOpen(true)}
      />

      <Modal isOpen={isEnhanceOpen} onOpenChange={setIsEnhanceOpen} size="2xl">
        <ModalContent>
          <ModalHeader>Enhance Voice Lines</ModalHeader>
          <ModalBody className="space-y-4">
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="flex-shrink-0 w-5 h-5 text-warning-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning-800 mb-1">
                    Important: Audio Deletion Notice
                  </p>
                  <p className="text-warning-700">
                    Enhancing voice lines will <strong>permanently delete all existing generated audio</strong> for the selected lines. You'll need to regenerate audio after enhancement.
                  </p>
                </div>
              </div>
            </div>
            
            <Textarea
              label="Your feedback"
              placeholder="Make them funnier and add more pauses..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEnhanceOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={onEnhance} isLoading={enhancing}>
              Run Enhancement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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

      <VoicePickerModal
        isOpen={isVoicePickerOpen}
        onOpenChange={setIsVoicePickerOpen}
        voices={voices}
        selectedVoiceId={scenario?.preferred_voice_id}
        onSelect={(id) => void persistPreferredVoice(id)}
      />
    </section>
  );
}


