import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Chip,
  addToast,
} from "@heroui/react";
import { CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/api";
import type { Scenario } from "@/types/scenario";

interface SetActiveModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: Scenario;
  onScenarioUpdate: () => Promise<void>;
}

interface AudioGenerationStatus {
  total_voice_lines: number;
  generated_count: number;
  pending_count: number;
  is_complete: boolean;
  can_activate: boolean;
}

export default function SetActiveModal({
  isOpen,
  onOpenChange,
  scenario,
  onScenarioUpdate,
}: SetActiveModalProps) {
  const [audioStatus, setAudioStatus] = useState<AudioGenerationStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAudioStatus();
    }
  }, [isOpen, scenario.id]);

  useEffect(() => {
    if (isPolling && audioStatus && !audioStatus.is_complete) {
      const interval = setInterval(fetchAudioStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isPolling, audioStatus]);

  async function fetchAudioStatus() {
    try {
      const res = await apiFetch(`/scenario/${scenario.id}/audio-status`);
      const data: AudioGenerationStatus = await res.json();
      setAudioStatus(data);
      
      // Stop polling if complete
      if (data.is_complete) {
        setIsPolling(false);
      }
    } catch (error) {
      console.error("Failed to fetch audio status:", error);
    }
  }

  async function handleGenerateAllAudios() {
    if (!scenario.preferred_voice_id) {
      addToast({
        title: "No voice selected",
        description: "Please select a preferred voice first",
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    setIsGenerating(true);
    setIsPolling(true);
    
    try {
      const res = await apiFetch(`/tts/generate/scenario`, {
        method: "POST",
        body: JSON.stringify({
          scenario_id: scenario.id,
          voice_id: scenario.preferred_voice_id,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to generate audios");
      
      const data = await res.json();
      addToast({
        title: "Audio generation started",
        description: `Generating ${data.total_processed} audio files...`,
        color: "primary",
        timeout: 3000,
      });
      
      // Start polling for status
      setTimeout(fetchAudioStatus, 1000);
    } catch (error) {
      console.error("Failed to generate audios:", error);
      addToast({
        title: "Generation failed",
        description: "Failed to start audio generation",
        color: "danger",
        timeout: 3000,
      });
      setIsPolling(false);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSetActive(isActive: boolean) {
    setIsUpdating(true);
    
    try {
      const res = await apiFetch(`/scenario/${scenario.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      addToast({
        title: isActive ? "Scenario activated" : "Scenario deactivated",
        description: `${scenario.title} is now ${isActive ? "active" : "inactive"}`,
        color: "success",
        timeout: 3000,
      });
      
      await onScenarioUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update active status:", error);
      addToast({
        title: "Update failed",
        description: error.message || "Failed to update scenario status",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const progress = audioStatus 
    ? (audioStatus.generated_count / audioStatus.total_voice_lines) * 100 
    : 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary" />
            Manage Scenario Status
          </div>
        </ModalHeader>
        <ModalBody className="space-y-4">
          {/* Safety Check */}
          {!scenario.is_safe && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="flex-shrink-0 w-5 h-5 text-danger-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-danger-800 mb-1">
                    Scenario is not safe
                  </p>
                  <p className="text-danger-700">
                    {scenario.is_not_safe_reason || "This scenario has been flagged as unsafe and cannot be activated."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
            <span className="text-sm font-medium">Current Status:</span>
            <Chip 
              color={scenario.is_active ? "success" : "default"} 
              variant="flat"
              size="sm"
            >
              {scenario.is_active ? "Active" : "Inactive"}
            </Chip>
          </div>

          {/* Audio Generation Status */}
          {audioStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Audio Generation:</span>
                {audioStatus.is_complete ? (
                  <Chip 
                    color="success" 
                    variant="flat"
                    size="sm"
                    startContent={<CheckCircleIcon className="w-4 h-4" />}
                  >
                    Complete
                  </Chip>
                ) : (
                  <span className="text-sm text-default-500">
                    {audioStatus.generated_count} / {audioStatus.total_voice_lines} generated
                  </span>
                )}
              </div>
              
              <Progress 
                value={progress} 
                color={audioStatus.is_complete ? "success" : "primary"}
                className="max-w-full"
                showValueLabel={!audioStatus.is_complete}
              />
              
              {audioStatus.pending_count > 0 && (
                <p className="text-xs text-default-500">
                  {audioStatus.pending_count} audio files are being processed...
                </p>
              )}
            </div>
          )}

          {/* Voice Selection Check */}
          {!scenario.preferred_voice_id && (
            <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-800">
                Please select a preferred voice before generating audio files.
              </p>
            </div>
          )}

          {/* Generate All Button */}
          {audioStatus && !audioStatus.is_complete && scenario.preferred_voice_id && (
            <Button
              color="primary"
              variant="flat"
              onPress={handleGenerateAllAudios}
              isLoading={isGenerating || isPolling}
              startContent={!isGenerating && !isPolling && <SparklesIcon className="w-4 h-4" />}
              className="w-full"
            >
              {isPolling ? "Generating Audio Files..." : "Generate All Audio Files"}
            </Button>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="light" size="sm" onPress={() => onOpenChange(false)}>
            Close
          </Button>
          
          {scenario.is_active ? (
            <Button
              color="warning"
              variant="flat"
              onPress={() => handleSetActive(false)}
              isLoading={isUpdating}
              isDisabled={!scenario.is_safe}
            >
              Deactivate Scenario
            </Button>
          ) : (
            <Button
              color="success"
              onPress={() => handleSetActive(true)}
              isLoading={isUpdating}
              isDisabled={!audioStatus?.can_activate}
            >
              Activate Scenario
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
