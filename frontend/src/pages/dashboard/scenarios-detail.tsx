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
} from "@heroui/react";
import { enhanceVoiceLines, fetchScenario } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import { generateSingleTTS } from "@/lib/api.tts";
import { AudioPlayerModal } from "@/components/ui/audio-player-modal";
import { PlayIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

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


  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await fetchScenario(id);
        setScenario(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
    
    // Find the index of the voice line to play
    const index = scenario.voice_lines.findIndex(vl => vl.id === voiceLineId);
    if (index === -1) return;
    
    setPlayerCurrentIndex(index);
    setIsPlayerOpen(true);
  }

  async function onCreateAudio(voiceLineId: number) {
    if (!scenario) return;
    setGenerating((prev) => new Set(prev).add(voiceLineId));
    try {
      const res = await generateSingleTTS({ voice_line_id: voiceLineId, language: scenario.language });
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
      } else {
        // eslint-disable-next-line no-alert
        alert(res.error_message || "Failed to generate audio");
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert("Failed to generate audio");
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(voiceLineId);
        return next;
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
          <p className="text-sm text-default-500">
            Target: {scenario.target_name} • Lang: {scenario.language}
          </p>
        </div>
        <Chip color={scenario.is_safe ? "success" : "danger"} variant="flat">
          {scenario.is_safe ? "Safe" : "Unsafe"}
        </Chip>
      </div>

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
            <Button
              color="primary"
              isDisabled={selected.size === 0}
              onPress={() => setIsEnhanceOpen(true)}
            >
              Enhance Selected
            </Button>

          </div>

          <Table aria-label="Voice lines table">
            <TableHeader>
              <TableColumn> </TableColumn>
              <TableColumn>Order</TableColumn>
              <TableColumn>Type</TableColumn>
              <TableColumn>Text</TableColumn>
              <TableColumn>Action</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No voice lines">
              {scenario.voice_lines
                .slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map((vl) => (
                  <TableRow key={vl.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(vl.id)}
                        onChange={() => toggleSelected(vl.id)}
                      />
                    </TableCell>
                    <TableCell>{vl.order_index}</TableCell>
                    <TableCell className="capitalize">{vl.type}</TableCell>
                    <TableCell className="whitespace-pre-wrap">{vl.text}</TableCell>
                    <TableCell>
                      {vl.storage_url ? (
                        <Button
                          size="sm"
                          variant="flat"
                          aria-label="Play audio"
                          onPress={() => onOpenPlayer(vl.id)}
                        >
                          <PlayIcon className="h-5 w-5" />
                        </Button>
                      ) : (
                        generating.has(vl.id) ? (
                          <Button size="sm" isDisabled aria-label="Generating audio">
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            color="primary"
                            aria-label="Create audio"
                            onPress={() => onCreateAudio(vl.id)}
                          >
                            <PlusIcon className="h-5 w-5" />
                          </Button>
                        )
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
        />
      )}
    </section>
  );
}


