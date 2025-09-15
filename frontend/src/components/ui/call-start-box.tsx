import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import type { Scenario } from "@/types/scenario";
import { apiFetch } from "@/lib/api";
import { tr } from "@/lib/i18n";
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
  const [toNumber, setToNumber] = useState<string>("");
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
    <div className="flex justify-center my-10">
      <Card className="ring-1 ring-success-200 border-success-200 bg-success-50/60 max-w-2xl w-2xl">
        <CardHeader className="py-5">
          <div className="flex items-center gap-4 w-full flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10 text-success">
                <span aria-hidden>📞</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Anruf starten</h2>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Input
                placeholder={tr("germanPhoneNumber")}
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                isInvalid={toNumber.length > 0 && !normalized}
                isDisabled={loading !== "idle"}
                size="lg"
                startContent={<span className="text-default-400" aria-hidden>📞</span>}
                className="w-68"
              />
              <Button
                size="lg"
                color="success"
                className="font-semibold text-white"
                onPress={startCall}
                isDisabled={!canAct}
                isLoading={loading === "dialing"}
              >
                {loading === "dialing" ? "Wählt..." : "Starten"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {error && (
          <CardBody className="py-2">
              <div className="p-2 rounded-medium bg-danger-50 border border-danger-200 text-danger text-xs">
                {error}
              </div>
          </CardBody>
        )}  
      </Card>
    </div>
  );
}


