import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Spinner } from "@heroui/react";
import { ScenarioInfo } from "@/components/ui/scenario-info";
import type { Scenario, VoiceLine, VoiceLineType } from "@/types/scenario";
import { fetchScenario } from "@/lib/api.scenarios";
import { TelnyxRTCProvider, Audio } from "@telnyx/react-client";
import { useTelnyxConference } from "@/hooks/useTelnyxConference";

type StartCallResponse = {
  call_control_id: string;
  call_leg_id?: string;
  call_session_id?: string;
  conference_name?: string;
  webrtc_token?: string;
};

type LocationState = {
  scenarioId?: number;
  result?: StartCallResponse;
};

function groupByType(voiceLines: VoiceLine[]) {
  const order: VoiceLineType[] = ["OPENING", "QUESTION", "RESPONSE", "CLOSING"];
  const map: Record<VoiceLineType, VoiceLine[]> = {
    OPENING: [],
    QUESTION: [],
    RESPONSE: [],
    CLOSING: [],
  };
  for (const vl of voiceLines) map[vl.type].push(vl);
  return order.map((t) => ({ type: t, items: map[t] }));
}

function ActiveCallContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [params] = useSearchParams();

  const fallbackScenarioId = params.get("scenarioId") ? Number(params.get("scenarioId")) : undefined;
  const scenarioId = state?.scenarioId ?? fallbackScenarioId;

  const [result] = useState<StartCallResponse | null>(state?.result ?? null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchScenario(scenarioId);
        setScenario(s);
      } catch (e: any) {
        setError(e?.message || "Failed to load scenario");
      } finally {
        setLoading(false);
      }
    })();
  }, [scenarioId]);

  const grouped = useMemo(() => groupByType(scenario?.voice_lines ?? []), [scenario]);

  if (!scenarioId) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Active Call</h1>
        </div>
        <Card>
          <CardBody className="space-y-3">
            <div className="text-danger">Missing scenario context.</div>
            <Button onPress={() => navigate(-1)}>Go back</Button>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Active Call</h1>
        <div className="flex items-center gap-2 text-sm text-default-500">
          {result?.call_control_id && (
            <Chip size="sm" variant="flat">CCID: {result.call_control_id}</Chip>
          )}
          {result?.conference_name && (
            <Chip size="sm" variant="flat">Conf: {result.conference_name}</Chip>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-default-500"><Spinner size="sm" /> Loading…</div>
      ) : error ? (
        <div className="text-danger">{error}</div>
      ) : scenario ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
          <div className="space-y-4">
            <Card className="ring-1 ring-default-200">
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-default-500">Scenario</div>
                    <div className="text-lg font-semibold">{scenario.title}</div>
                  </div>
                  <Chip color={scenario.is_safe ? "success" : "danger"} variant="flat">
                    {scenario.is_safe ? "Safe" : "Unsafe"}
                  </Chip>
                </div>
                <Divider className="my-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped.map(({ type, items }) => (
                    <div key={type} className="space-y-2">
                      <div className="text-xs font-medium text-default-600">{type}</div>
                      <div className="flex flex-wrap gap-2">
                        {items.length === 0 && <div className="text-xs text-default-400">No lines</div>}
                        {items.map((vl) => (
                          <Button key={vl.id} size="sm" variant="flat" onPress={() => {
                            // TODO: Implement backend inject
                            console.log("Inject voice line", vl.id, vl.text);
                          }}>
                            {vl.text.length > 28 ? vl.text.slice(0, 28) + "…" : vl.text}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            <ScenarioInfo scenario={scenario} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function ActiveCallPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const result = state?.result;

  // If we have WebRTC credentials, wrap in provider
  if (result?.webrtc_token && result?.conference_name) {
    return (
      <TelnyxRTCProvider 
        credential={{ login_token: result.webrtc_token } as any} 
        options={{ debug: true }}
      >
        <WebRTCMonitor token={result.webrtc_token} conference={result.conference_name} />
        <ActiveCallContent />
      </TelnyxRTCProvider>
    );
  }

  // Otherwise just show the regular content
  return <ActiveCallContent />;
}

function WebRTCMonitor({ token, conference }: { token: string; conference: string }) {
  const navigate = useNavigate();
  const { remoteStream, connectionState, error, hangupReason } = useTelnyxConference({ 
    token, 
    conference,
    autoJoin: true 
  });

  // Handle hangup - navigate back or show message
  useEffect(() => {
    if (connectionState === "hangup") {
      // Auto-navigate back after 3 seconds
      const timer = setTimeout(() => {
        navigate("/dashboard/phone-call");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, navigate]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Call Monitor</h3>
          <Chip 
            size="sm" 
            variant="flat" 
            color={
              connectionState === "connected" ? "success" : 
              connectionState === "hangup" ? "default" :
              connectionState === "error" ? "danger" : "warning"
            }
          >
            {connectionState === "hangup" ? "Call Ended" : connectionState}
          </Chip>
        </div>
      </CardHeader>
      <CardBody>
        <Audio stream={remoteStream} autoPlay playsInline />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-default-500">Conference:</span>
            <span className="font-mono">{conference}</span>
          </div>
          {connectionState === "connected" && (
            <div className="text-success">🔇 Receive-only mode (no microphone access)</div>
          )}
          {connectionState === "connecting" && (
            <div className="text-warning">Connecting to conference...</div>
          )}
          {connectionState === "hangup" && (
            <div className="space-y-2">
              <div className="text-default-500">
                📞 {hangupReason || "Call ended"}
              </div>
              <div className="text-xs text-default-400">
                Redirecting back in 3 seconds...
              </div>
              <Button size="sm" variant="flat" onPress={() => navigate("/dashboard/phone-call")}>
                Back to Phone Call
              </Button>
            </div>
          )}
          {error && (
            <div className="text-danger text-xs">{error}</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}


