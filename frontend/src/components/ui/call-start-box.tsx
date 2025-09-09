import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import type { Scenario } from "@/types/scenario";
import { apiFetch } from "@/lib/api";
// Using emoji for icons

type StartCallResponse = {
  call_control_id: string;
  call_leg_id?: string;
  call_session_id?: string;
  conference_name?: string;
  webrtc_token?: string;
};

function normalizeGermanNumber(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) {
    if (!digits.startsWith("+49")) return null;
    const rest = digits.slice(3);
    if (!/^\d{7,12}$/.test(rest)) return null;
    return `+49${rest}`;
  }
  const stripped = input.replace(/\D/g, "");
  if (stripped.startsWith("0")) {
    const rest = stripped.replace(/^0+/, "");
    if (!/^\d{7,12}$/.test(rest)) return null;
    return `+49${rest}`;
  }
  return null;
}

export function CallStartBox({ scenario }: { scenario: Scenario }) {
  const [toNumber, setToNumber] = useState<string>("+491729859252");
  const [loading, setLoading] = useState<"idle" | "dialing">("idle");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const normalized = useMemo(() => normalizeGermanNumber(toNumber), [toNumber]);
  const canAct = !!scenario?.id && !!normalized && loading === "idle";

  async function startCall() {
    if (!scenario?.id || !normalized) return;
    setError(null);
    setLoading("dialing");
    try {
      const res = await apiFetch(`/telnyx/call`, {
        method: "POST",
        body: JSON.stringify({ to_number: normalized, scenario_id: scenario.id }),
      });
      const data: StartCallResponse = await res.json();
      navigate("/dashboard/active-call", {
        state: { scenarioId: scenario.id, result: data },
      });
    } catch (e: any) {
      setError(e?.message || "Call failed");
    } finally {
      setLoading("idle");
    }
  }

  return (
    <div className="flex justify-center">
      <Card className="ring-1 ring-primary-200 border-primary-200 bg-primary-50/60 max-w-xl w-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <span aria-hidden>📞</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Start Call</h2>
              <p className="text-sm text-default-500">Dial a number and jump into the call</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-3 flex flex-col items-center justify-center mb-4">
          <div className="max-w-sm w-full flex flex-col items-center justify-center gap-4">
            <Input
              label="German Phone Number"
              placeholder="+49301234567"
              labelPlacement="outside"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
              // description={normalized ? `Will dial: ${normalized}` : "Enter a valid German (+49) number"}
              isInvalid={toNumber.length > 0 && !normalized}
              isDisabled={loading !== "idle"}
              size="md"
              startContent={<span className="text-default-400" aria-hidden>📞</span>}
              className="max-w-sm"
            />
            <Button
              size="md"
              color="primary"
              className="font-semibold text-white w-full"
              onPress={startCall}
              isDisabled={!canAct}
              isLoading={loading === "dialing"}
            >
              {loading === "dialing" ? "Dialing..." : (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden>📞</span> Start Call
                </span>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="p-2 rounded-medium bg-danger-50 border border-danger-200 text-danger text-xs">
              {error}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}


