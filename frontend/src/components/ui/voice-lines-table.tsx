import { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
  Tabs,
  Tab,
  Spinner,
} from "@heroui/react";
import { generateSingleTTS, fetchVoiceLinesSummary } from "@/lib/api.tts";
import { PlayIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { Scenario } from "@/types/scenario";

interface VoiceLinesTableProps {
  scenario: Scenario;
  onRefetchScenario: () => Promise<void>;
  selected: Set<number>;
  onSelectionChange: Dispatch<SetStateAction<Set<number>>>;
  onOpenPlayer: (voiceLineId: number) => void;
  onEnhanceSelected: () => void;
}

export function VoiceLinesTable({
  scenario,
  onRefetchScenario,
  selected,
  onSelectionChange,
  onOpenPlayer,
  onEnhanceSelected,
}: VoiceLinesTableProps) {
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"ALL" | "OPENING" | "QUESTION" | "RESPONSE" | "CLOSING" | "FILLER">("ALL");
  const [summaryEtag, setSummaryEtag] = useState<string | undefined>(undefined);
  const [pollInterval, setPollInterval] = useState(2000);
  const [consecutiveNoChanges, setConsecutiveNoChanges] = useState(0);

  // Helper function to check if audio is available for a voice line
  const isAudioAvailable = (voiceLineId: number): boolean => {
    if (!scenario?.voice_lines) return false;
    const voiceLine = scenario.voice_lines.find(vl => vl.id === voiceLineId);
    return !!(voiceLine?.preferred_audio?.signed_url);
  };

  // Memoize filtered and sorted voice lines to prevent unnecessary re-renders
  const filteredVoiceLines = useMemo(() => {
    if (!scenario) return [];
    const filtered = activeTab === 'ALL' 
      ? scenario.voice_lines 
      : scenario.voice_lines.filter(vl => vl.type === activeTab);
    
    const sorted = filtered.slice().sort((a, b) => a.order_index - b.order_index);
    return sorted;
  }, [scenario?.voice_lines, activeTab]);

  async function onCreateAudio(voiceLineId: number) {
    if (!scenario || !scenario.preferred_voice_id) {
      addToast({ title: "No voice selected", description: "Select a voice first to generate audio.", color: "warning", timeout: 1000 });
      return;
    }
        
    try {
      const res = await generateSingleTTS({ 
        voice_line_id: voiceLineId, 
        voice_id: scenario.preferred_voice_id 
      });
            
      if (res.success) {
          if (res.signed_url) {
            await onRefetchScenario();
            addToast({ 
              title: "Audio ready", 
              description: "Audio file already exists.", 
              color: "success", 
              timeout: 1000 
            });
            return;
          }
          // Mark as pending; summary poller will pick up
          setPending((prev) => new Set(prev).add(voiceLineId));

          addToast({ 
            title: "Generation started", 
            description: "Audio is being generated.", 
            color: "primary", 
            timeout: 1000 
          });
      } else {
        addToast({
          title: "Generation failed",
          description: res.error_message || "Failed to generate audio",
          color: "danger",
          timeout: 3000,
        });
      }
    } catch (e) {
      addToast({
        title: "Request failed",
        description: "Failed to generate audio",
        color: "danger",
        timeout: 3000,
      });
    }
  }

  // Summary polling with ETag (only when there are pending items)
  useEffect(() => {
    if (!scenario?.id) return;
    if (pending.size === 0) {
      // Reset polling state when no pending items
      setPollInterval(2000);
      setConsecutiveNoChanges(0);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetchVoiceLinesSummary(scenario.id, summaryEtag);
        if (cancelled) return;
        
        if (res.notModified) {
          // Exponential backoff when no changes detected
          setConsecutiveNoChanges(prev => prev + 1);
          setPollInterval(prev => Math.min(prev * 1.5, 10000)); // Max 10 seconds
          return;
        }

        // Reset fast polling on change
        setConsecutiveNoChanges(0);
        setPollInterval(2000);

        if (res.etag) setSummaryEtag(res.etag);
        const items = res.data?.items || [];

        // Determine which IDs moved to READY
        const readyIds = new Set<number>();
        for (const it of items) {
          if (it.status === "READY") {
            readyIds.add(it.voice_line_id);
          }
        }

        // Remove READY from pending
        if (readyIds.size > 0) {
          setPending((prev) => {
            const next = new Set(prev);
            for (const id of Array.from(readyIds)) next.delete(id);
            return next;
          });
          // Refresh scenario to update signed URLs
          await onRefetchScenario();
        }

        // Add any reported PENDING to pending set
        const pendingIds = items.filter(i => i.status === "PENDING").map(i => i.voice_line_id);
        if (pendingIds.length > 0) {
          setPending((prev) => {
            const next = new Set(prev);
            pendingIds.forEach(id => next.add(id));
            return next;
          });
        }
      } catch (e) {
        // ignore transient
      }
    };

    const interval = setInterval(poll, pollInterval);
    void poll();
    return () => { cancelled = true; clearInterval(interval); };
  }, [scenario?.id, pending.size, summaryEtag, onRefetchScenario, pollInterval]);

  // One-time discovery on scenario change: find PENDING items via summary
  useEffect(() => {
    if (!scenario?.id) return;
    let cancelled = false;
    
    // Small delay to avoid duplicate request with initial polling
    const timer = setTimeout(async () => {
      try {
        const res = await fetchVoiceLinesSummary(scenario.id);
        if (cancelled) return;
        if (res.etag) setSummaryEtag(res.etag);
        const items = res.data?.items || [];
        const pendingIds = items.filter(i => i.status === "PENDING").map(i => i.voice_line_id);
        if (pendingIds.length) {
          setPending(new Set(pendingIds));
        } else {
          setPending(new Set());
        }
      } catch {
        // ignore
      }
    }, 100);
    
    return () => { 
      cancelled = true; 
      clearTimeout(timer);
    };
  }, [scenario?.id]);

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Voice Lines</h2>
          <div className="flex items-center gap-2">
            {!scenario.preferred_voice_id && (
              <Chip size="sm" variant="flat" color="warning">Select a voice to enable generation</Chip>
            )}
            <Button
              color="primary"
              isDisabled={selected.size === 0}
              onPress={onEnhanceSelected}
            >
              Enhance Selected ({selected.size})
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
            <Tab key="FILLER" title={`Filler (${scenario.voice_lines.filter(v=>v.type==='FILLER').length})`} />
          </Tabs>
        </div>

        <div className="min-h-[400px]">
          <Table 
            aria-label="Voice lines table"
            className="table-fixed"
            removeWrapper
            selectionMode="multiple"
            selectedKeys={new Set(Array.from(selected).map(String))}
            onSelectionChange={(keys) => {
              if (keys === "all") {
                onSelectionChange(new Set(filteredVoiceLines.map(vl => vl.id)));
              } else {
                onSelectionChange(new Set(Array.from(keys as Set<string>).map(Number)));
              }
            }}
          >
            <TableHeader>
              <TableColumn className="w-20 min-w-20">Order</TableColumn>
              <TableColumn className="w-32 min-w-32">Type</TableColumn>
              <TableColumn className="min-w-0">Text</TableColumn>
              <TableColumn className="w-36 min-w-36">Action</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No voice lines">
              {filteredVoiceLines.map((vl) => (
                <TableRow 
                  key={vl.id}
                  className="hover:bg-default-50 transition-colors duration-150"
                >
                  <TableCell>
                    <span className="text-small font-medium">{vl.order_index}</span>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-small font-medium">{vl.type}</span>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-pre-wrap text-small break-words max-w-full overflow-hidden">
                      {vl.text}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-start">
                      {isAudioAvailable(vl.id) ? (
                        <Button 
                          size="sm" 
                          variant="flat" 
                          aria-label="Open player" 
                          onPress={() => onOpenPlayer(vl.id)}
                          className="hover:bg-primary/10 transition-colors"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          color={(generating.has(vl.id) || pending.has(vl.id)) ? "warning" : "primary"}
                          aria-label="Create audio" 
                          onPress={() => onCreateAudio(vl.id)}
                          className={(generating.has(vl.id) || pending.has(vl.id)) ? "cursor-not-allowed" : "hover:bg-primary/80 transition-colors"}
                          isLoading={generating.has(vl.id) || pending.has(vl.id)}
                          isDisabled={generating.has(vl.id) || pending.has(vl.id) || !scenario.preferred_voice_id}
                        >
                          {!(generating.has(vl.id) || pending.has(vl.id)) && <PlusIcon className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardBody>
    </Card>
  );
}

