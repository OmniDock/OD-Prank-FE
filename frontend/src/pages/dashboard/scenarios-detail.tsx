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
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  Checkbox,
  addToast,
  Tabs,
  Tab,
} from "@heroui/react";
import { enhanceVoiceLines, fetchScenario, updateScenarioPreferredVoice } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import { generateSingleTTS, fetchVoices, getAudioUrl } from "@/lib/api.tts";
import { AudioPlayerModal } from "@/components/ui/audio-player-modal";
import { VoicePickerModal } from "@/components/ui/voice-picker-modal";
import { PlayIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import type { VoiceItem } from "@/types/tts";

export default function ScenarioDetailPage() {
  const { id } = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isEnhanceOpen, setIsEnhanceOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerCurrentIndex, setPlayerCurrentIndex] = useState(0);
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<"ALL" | "OPENING" | "QUESTION" | "RESPONSE" | "CLOSING">("ALL");


  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await fetchScenario(id);
        setScenario(data);
        setSelectedVoiceId(data.preferred_voice_id ?? null);
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

  // Refresh audio availability for current selected voice across voice lines
  useEffect(() => {
    (async () => {
      if (!scenario || !selectedVoiceId) {
        setAudioAvailable({});
        return;
      }
      const entries: Array<Promise<void>> = [];
      const next: Record<number, boolean> = {};
      for (const vl of scenario.voice_lines) {
        entries.push(
          getAudioUrl(vl.id, selectedVoiceId)
            .then(() => { next[vl.id] = true; })
            .catch(() => { next[vl.id] = false; })
        );
      }
      await Promise.all(entries);
      setAudioAvailable(next);
    })();
  }, [scenario?.id, scenario?.voice_lines.length, selectedVoiceId]);

  function toggleSelected(voiceLineId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(voiceLineId) ? next.delete(voiceLineId) : next.add(voiceLineId);
      return next;
    });
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
        const updated = { ...scenario };
        res.successful_enhancements.forEach((it) => {
          const vl = updated.voice_lines.find((v) => v.id === it.voice_line_id);
          if (vl && it.enhanced_text) vl.text = it.enhanced_text;
        });
        setScenario(updated);
      }
      setIsEnhanceOpen(false);
      setSelected(new Set());
      setFeedback("");
    } finally {
      setEnhancing(false);
    }
  }

  async function onOpenPlayer(voiceLineId: number) {
    if (!scenario) return;
    if (!selectedVoiceId) {
      addToast({ title: "Select a voice first", description: "Choose a voice to play audio.", color: "warning", timeout: 3000 });
      return;
    }
    if (!audioAvailable[voiceLineId]) {
      addToast({ title: "No audio yet", description: "Generate audio for this voice line first.", color: "default", timeout: 3000 });
      return;
    }
    const index = scenario.voice_lines.findIndex(vl => vl.id === voiceLineId);
    if (index === -1) return;
    setPlayerCurrentIndex(index);
    setIsPlayerOpen(true);
  }

  async function onCreateAudio(voiceLineId: number) {
    if (!scenario) return;
    if (!selectedVoiceId) {
      addToast({ title: "Select a voice first", description: "Pick a voice for this scenario before generating.", color: "warning", timeout: 3000 });
      return;
    }
    setGenerating((prev) => new Set(prev).add(voiceLineId));
    try {
      const res = await generateSingleTTS({ voice_line_id: voiceLineId, language: scenario.language, voice_id: selectedVoiceId ?? undefined });
      if (res.success && res.signed_url) {
        setScenario((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            voice_lines: prev.voice_lines.map((v) =>
              v.id === voiceLineId ? { ...v, storage_url: res.signed_url } : v
            ),
          };
        });
        setAudioAvailable((prev) => ({ ...prev, [voiceLineId]: true }));
        addToast({ title: "Audio generated", description: "You can now play this line.", color: "success", timeout: 3000 });
      } else {
        addToast({
          title: "Generation failed",
          description: res.error_message || "Failed to generate audio",
          color: "danger",
          timeout: 5000,
        });
      }
    } catch (e) {
      addToast({
        title: "Request failed",
        description: "Failed to generate audio",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(voiceLineId);
        return next;
      });
    }
  }

  async function persistPreferredVoice(voiceId: string) {
    if (!scenario) return;
    try {
      const updated = await updateScenarioPreferredVoice(scenario.id, voiceId);
      setScenario(updated);
      setSelectedVoiceId(voiceId);
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

      {/* Scenario Details */}
      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Scenario Details</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
            {scenario.description && (
              <div className="rounded-large border border-default-200 p-4 bg-content2/20">
                <div className="text-sm font-medium text-default-600 mb-2">Description</div>
                <p className="text-default-900 whitespace-pre-wrap">{scenario.description}</p>
              </div>
            )}

            <div className="rounded-large border border-default-200 p-4 bg-content2/20 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-default-500">Target</div>
                <div className="text-sm text-default-900">{scenario.target_name}</div>
              </div>
              <div>
                <div className="text-xs text-default-500">Language</div>
                <div className="text-sm text-default-900">{scenario.language}</div>
              </div>
              <div>
                <div className="text-xs text-default-500">Voice Lines</div>
                <div className="text-sm text-default-900">{scenario.voice_lines.length}</div>
              </div>
              <div>
                <div className="text-xs text-default-500">Created</div>
                <div className="text-sm text-default-900">{new Date(scenario.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-default-500">Updated</div>
                <div className="text-sm text-default-900">{new Date(scenario.updated_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Voice Settings - separate card */}
      <Card className={!selectedVoiceId ? "ring-1 ring-warning bg-warning/5" : undefined}>
        <CardBody>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-default-600">
              Selected Voice: {(() => {
                const vid = scenario.preferred_voice_id ?? selectedVoiceId;
                if (!vid) return "None";
                const v = voices.find(x => x.id === vid);
                return v ? `${v.name} (${v.gender})` : vid;
              })()}
            </div>
            <Button variant="flat" onPress={() => setIsVoicePickerOpen(true)}>Choose voice</Button>
          </div>
          {!selectedVoiceId && (
            <div className="text-xs text-warning mt-2">Select a voice to enable MP3 generation for voice lines.</div>
          )}
        </CardBody>
      </Card>

      {!scenario.is_safe && scenario.is_not_safe_reason && (
        <Card>
          <CardBody>
            <div className="text-sm">Not safe because: {scenario.is_not_safe_reason}</div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Voice Lines</h2>
            <div className="flex items-center gap-2">
              {!selectedVoiceId && (
                <Chip size="sm" variant="flat" color="warning">Select a voice to enable generation</Chip>
              )}
              <Button
                color="primary"
                isDisabled={selected.size === 0}
                onPress={() => setIsEnhanceOpen(true)}
              >
                Enhance Selected
              </Button>
            </div>
          </div>

          <div className="mb-3">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as any)}
              variant="underlined"
              color="primary"
              size="sm"
            >
              <Tab key="ALL" title={`All (${scenario.voice_lines.length})`} />
              <Tab key="OPENING" title={`Opening (${scenario.voice_lines.filter(v=>v.type==='OPENING').length})`} />
              <Tab key="QUESTION" title={`Question (${scenario.voice_lines.filter(v=>v.type==='QUESTION').length})`} />
              <Tab key="RESPONSE" title={`Response (${scenario.voice_lines.filter(v=>v.type==='RESPONSE').length})`} />
              <Tab key="CLOSING" title={`Closing (${scenario.voice_lines.filter(v=>v.type==='CLOSING').length})`} />
            </Tabs>
          </div>

          <Table aria-label="Voice lines table">
            <TableHeader>
              <TableColumn className="w-10"> </TableColumn>
              <TableColumn className="w-16">Order</TableColumn>
              <TableColumn className="w-28">Type</TableColumn>
              <TableColumn>Text</TableColumn>
              <TableColumn className="w-28">Action</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No voice lines">
              {(activeTab === 'ALL' ? scenario.voice_lines : scenario.voice_lines.filter(vl => vl.type === activeTab))
                .slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map((vl) => (
                  <TableRow key={vl.id}>
                    <TableCell>
                      <Checkbox
                        size="sm"
                        isSelected={selected.has(vl.id)}
                        onValueChange={() => toggleSelected(vl.id)}
                        aria-label={`Select voice line ${vl.id}`}
                      />
                    </TableCell>
                    <TableCell>{vl.order_index}</TableCell>
                    <TableCell className="capitalize">{vl.type}</TableCell>
                    <TableCell className="whitespace-pre-wrap">{vl.text}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {!selectedVoiceId ? (
                        <span className="text-xs text-default-400">Select a voice to enable</span>
                      ) : audioAvailable[vl.id] ? (
                        <Button size="sm" variant="flat" aria-label="Open player" onPress={() => onOpenPlayer(vl.id)}>
                          <PlayIcon className="h-5 w-5" />
                        </Button>
                      ) : generating.has(vl.id) ? (
                        <Button size="sm" isDisabled aria-label="Generating audio">
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        </Button>
                      ) : (
                        <Button size="sm" color="primary" aria-label="Create audio" onPress={() => onCreateAudio(vl.id)}>
                          <PlusIcon className="h-5 w-5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isEnhanceOpen} onOpenChange={setIsEnhanceOpen}>
        <ModalContent>
          <ModalHeader>Enhance Voice Lines</ModalHeader>
          <ModalBody>
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
          preferredVoiceId={selectedVoiceId ?? scenario.preferred_voice_id ?? null}
        />
      )}

      <VoicePickerModal
        isOpen={isVoicePickerOpen}
        onOpenChange={setIsVoicePickerOpen}
        voices={voices}
        selectedVoiceId={selectedVoiceId ?? scenario?.preferred_voice_id}
        onSelect={(id) => void persistPreferredVoice(id)}
      />
    </section>
  );
}


