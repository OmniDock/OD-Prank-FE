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
import { generateSingleTTS, getAudioUrl } from "@/lib/api.tts";
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
  const [activeTab, setActiveTab] = useState<"ALL" | "OPENING" | "QUESTION" | "RESPONSE" | "CLOSING">("ALL");

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



  // async function onCreateAudio(voiceLineId: number) {
  //   if (!scenario || !scenario.preferred_voice_id) {
  //     addToast({ title: "No voice selected", description: "Select a voice first to generate audio.", color: "warning", timeout: 3000 });
  //     return;
  //   }
        
  //   try {
  //     const res = await generateSingleTTS({ 
  //       voice_line_id: voiceLineId, 
  //       voice_id: scenario.preferred_voice_id 
  //     });
            
  //     if (res.success) {
  //       if (res.signed_url) {
  //         // Audio is immediately available (from cache)
  //         await onRefetchScenario(); // Refetch to get updated audio info
  //         addToast({ title: "Audio ready", description: "You can now play this line.", color: "success", timeout: 3000 });
  //         // Clear generating state - we're done
  //         setGenerating((prev) => {
  //           const next = new Set(prev);
  //           next.delete(voiceLineId);
  //           return next;
  //         });
  //       } else {
  //         // Audio generation started in background - move from generating to pending
  //         setPending((prev) => new Set(prev).add(voiceLineId));
  //         setGenerating((prev) => {
  //           const next = new Set(prev);
  //           next.delete(voiceLineId);
  //           return next;
  //         });
  //         addToast({ 
  //           title: "Generation started", 
  //           description: "Audio is being generated. Refreshing when ready...", 
  //           color: "primary", 
  //           timeout: 4000 
  //         });
          
  //         // Poll for completion and refetch scenario when ready
  //         const pollInterval = setInterval(async () => {
  //           try {
  //             const r = await getAudioUrl(voiceLineId, scenario.preferred_voice_id as string);
  //             if ((r as any)?.status === "PENDING") {
  //               // keep waiting
  //               return;
  //             }
  //             if ((r as any)?.signed_url) {
  //               // Audio is now available - refetch scenario
  //               await onRefetchScenario();
  //               addToast({ title: "Audio ready", description: "Background generation completed!", color: "success", timeout: 3000 });
  //               clearInterval(pollInterval);
  //               setPending((prev) => {
  //                 const next = new Set(prev);
  //                 next.delete(voiceLineId);
  //                 return next;
  //               });
  //             }
  //           } catch {
  //             // Still not ready or transient error, continue polling
  //             console.debug(`Audio not yet ready for voice line ${voiceLineId}, continuing to poll...`);
  //           }
  //         }, 2000);
          
  //         // Stop polling after 60 seconds
  //         setTimeout(() => {
  //           clearInterval(pollInterval);
  //           console.warn(`Stopped polling for voice line ${voiceLineId} after timeout`);
  //           setPending((prev) => {
  //             const next = new Set(prev);
  //             next.delete(voiceLineId);
  //             return next;
  //           });
  //         }, 60000);
  //       }
  //     } else {
  //       // Generation failed - clear generating state
  //       setGenerating((prev) => {
  //         const next = new Set(prev);
  //         next.delete(voiceLineId);
  //         return next;
  //       });
  //       addToast({
  //         title: "Generation failed",
  //         description: res.error_message || "Failed to generate audio",
  //         color: "danger",
  //         timeout: 5000,
  //       });
  //     }
  //   } catch (e) {
  //     // Network/request error - clear generating state
  //     setGenerating((prev) => {
  //       const next = new Set(prev);
  //       next.delete(voiceLineId);
  //       return next;
  //     });
  //     addToast({
  //       title: "Request failed",
  //       description: "Failed to generate audio",
  //       color: "danger",
  //       timeout: 5000,
  //     });
  //   }
  // }




  async function onCreateAudio(voiceLineId: number) {
    if (!scenario || !scenario.preferred_voice_id) {
      addToast({ title: "No voice selected", description: "Select a voice first to generate audio.", color: "warning", timeout: 3000 });
      return;
    }
        
    try {
      const res = await generateSingleTTS({ 
        voice_line_id: voiceLineId, 
        voice_id: scenario.preferred_voice_id 
      });
            
      if (res.success) {
          // Audio generation started in background - move from generating to pending
          setPending((prev) => new Set(prev).add(voiceLineId));

          addToast({ 
            title: "Generation started", 
            description: "Audio is being generated. Refreshing when ready...", 
            color: "primary", 
            timeout: 4000 
          });
          
          // Poll for completion and refetch scenario when ready
          const pollInterval = setInterval(async () => {
            try {
              const r = await getAudioUrl(voiceLineId, scenario.preferred_voice_id as string);
                              if ((r as any)?.status === "PENDING") {
                  // keep waiting
                  return;
                }
              if ((r as any)?.signed_url) {
                // Audio is now available - refetch scenario
                await onRefetchScenario();
                addToast({ title: "Audio ready", description: "Background generation completed!", color: "success", timeout: 3000 });
                clearInterval(pollInterval);
                setPending((prev) => {
                  const next = new Set(prev);
                  next.delete(voiceLineId);
                  return next;
                });
              }
            } catch {
              // Still not ready or transient error, continue polling
              console.debug(`Audio not yet ready for voice line ${voiceLineId}, continuing to poll...`);
            }
          }, 2000);
          
          // Stop polling after 60 seconds
          setTimeout(() => {
            clearInterval(pollInterval);
            console.warn(`Stopped polling for voice line ${voiceLineId} after timeout`);
            setPending((prev) => {
              const next = new Set(prev);
              next.delete(voiceLineId);
              return next;
            });
          }, 60000);
        
      } else {
        addToast({
          title: "Generation failed",
          description: res.error_message || "Failed to generate audio",
          color: "danger",
          timeout: 5000,
        });
      }
    } catch (e) {
      // Network/request error - clear generating state

      addToast({
        title: "Request failed",
        description: "Failed to generate audio",
        color: "danger",
        timeout: 5000,
      });
    }
  }


  // Passive polling: only poll rows marked as pending to avoid 404 noise
  useEffect(() => {
    if (!scenario?.preferred_voice_id) return;
    if (pending.size === 0) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const ids = Array.from(pending);
      if (ids.length === 0) return;

      const toRemove: number[] = [];
      let anyReady = false;
      for (const id of ids) {
        try {
          const r = await getAudioUrl(id, scenario.preferred_voice_id as string);
          if ((r as any)?.signed_url) {
            anyReady = true;
            toRemove.push(id);
          }
        } catch {
          // ignore transient errors
        }
      }

      if (toRemove.length && !cancelled) {
        setPending((prev) => {
          const next = new Set(prev);
          toRemove.forEach((id) => next.delete(id));
          return next;
        });
      }

      if (anyReady && !cancelled) await onRefetchScenario();
    };

    const interval = setInterval(tick, 2000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pending, scenario?.preferred_voice_id]);

  // One-time discovery: when scenario loads/changes, detect rows already in PENDING on the server
  useEffect(() => {
    if (!scenario?.preferred_voice_id) return;
    let cancelled = false;

    const discover = async () => {
      const targets = scenario.voice_lines.filter(v => !v.preferred_audio?.signed_url);
      if (targets.length === 0) return;
      for (const vl of targets) {
        if (cancelled) return;
        if (pending.has(vl.id)) continue;
        try {
          const r = await getAudioUrl(vl.id, scenario.preferred_voice_id as string);
          if ((r as any)?.status === "PENDING") {
            setPending((prev) => new Set(prev).add(vl.id));
          }
        } catch {
          // ignore
        }
      }
    };

    void discover();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id, scenario?.voice_lines, scenario?.preferred_voice_id]);

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

