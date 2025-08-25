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
      <Card className="ring-1 ring-default-200">
        <CardBody className="gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Scenario Details</h2>
              <p className="text-sm text-default-500">Overview and configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            {scenario.description && (
              <div className="p-5 rounded-xl border border-default-200 bg-gradient-to-br from-default-50 to-default-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-default-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span className="text-sm font-semibold text-default-700">Description</span>
                </div>
                <p className="text-default-900 whitespace-pre-wrap leading-relaxed">{scenario.description}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Target and Language Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-medium text-primary">Target</span>
                  </div>
                  <div className="text-base font-semibold text-foreground">{scenario.target_name}</div>
                </div>
                
                <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-secondary/5 to-secondary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span className="text-xs font-medium text-secondary">Language</span>
                  </div>
                  <div className="text-base font-semibold text-foreground">{scenario.language}</div>
                </div>
              </div>

              {/* Voice Lines Count */}
              <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-success/5 to-success/10">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 14h14l-2-14M11 9v4M13 9v4" />
                  </svg>
                  <span className="text-xs font-medium text-success">Voice Lines</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{scenario.voice_lines.length}</div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg border border-default-200 bg-default-50">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3 h-3 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-xs font-medium text-default-600">Created</span>
                  </div>
                  <div className="text-sm text-default-900">{new Date(scenario.created_at).toLocaleString()}</div>
                </div>
                
                <div className="p-3 rounded-lg border border-default-200 bg-default-50">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3 h-3 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs font-medium text-default-600">Updated</span>
                  </div>
                  <div className="text-sm text-default-900">{new Date(scenario.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Voice Settings - separate card */}
      <Card className={!selectedVoiceId ? "ring-2 ring-warning bg-warning/5" : "ring-1 ring-success/20 bg-success/5"}>
        <CardBody className="gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Voice Selection</h3>
              <p className="text-sm text-default-500">Choose a voice for MP3 generation</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50 border border-default-200">
            <div className="flex-1">
              <div className="text-sm font-medium text-default-700">Current Voice</div>
              <div className="text-base font-semibold text-foreground mt-1">
                {(() => {
                  const vid = scenario.preferred_voice_id ?? selectedVoiceId;
                  if (!vid) return (
                    <span className="text-default-400 italic">No voice selected</span>
                  );
                  const v = voices.find(x => x.id === vid);
                  return v ? (
                    <div className="flex items-center gap-2">
                      <span>{v.name}</span>
                      <Chip size="sm" variant="flat" color="primary">
                        {v.gender}
                      </Chip>
                    </div>
                  ) : (
                    <span className="text-default-600">{vid}</span>
                  );
                })()}
              </div>
            </div>
            <Button 
              color="primary" 
              variant={selectedVoiceId ? "flat" : "solid"}
              onPress={() => setIsVoicePickerOpen(true)}
              className="shrink-0"
            >
              {selectedVoiceId ? "Change Voice" : "Select Voice"}
            </Button>
          </div>
          
          {!selectedVoiceId && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <svg className="w-4 h-4 text-warning shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-warning-700">
                A voice must be selected to enable MP3 generation for voice lines.
              </span>
            </div>
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


