import { useEffect, useState } from "react";
import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import { fetchVoiceLinesSummary } from "@/lib/api.tts";

interface VoiceGenerationStatusProps {
  scenarioId: number;
  totalCount: number;
}

export function VoiceGenerationStatus({ scenarioId, totalCount }: VoiceGenerationStatusProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [etag, setEtag] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;

    const poll = async () => {
      try {
        const res = await fetchVoiceLinesSummary(scenarioId, etag);
        if (cancelled) return;
        if (res.notModified) return;
        if (res.etag) setEtag(res.etag);
        const items = res.data?.items || [];
        const pending = items.filter(i => i.status === "PENDING").length;
        const ready = items.filter(i => i.status === "READY").length;
        setPendingCount(pending);
        setReadyCount(ready);
      } catch {
        // ignore errors; try again
      }
    };

    // initial fetch
    void poll();
    interval = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [scenarioId, etag]);

  if (pendingCount <= 0) return null;

  return (
    <Card className="ring-1 ring-primary/20 bg-primary/5">
      <CardBody className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Spinner size="sm" color="primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Generating audio files…</div>
            <div className="text-xs text-default-500">This may take a moment.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" color="primary">Ready {readyCount}/{totalCount}</Chip>
          <Chip size="sm" variant="flat" color="warning">Pending {pendingCount}</Chip>
        </div>
      </CardBody>
    </Card>
  );
}


