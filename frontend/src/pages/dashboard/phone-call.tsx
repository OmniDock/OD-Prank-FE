import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Chip } from "@heroui/react";
import { apiFetch } from "@/lib/api";
import type { Scenario } from "@/types/scenario";
import { useNavigate } from "react-router-dom";
import ScenarioGridSelect from "@/components/ui/scenario-grid-select";
import HorizontalSteps from "@/components/ui/horizontal-steps";
import { motion } from "framer-motion";

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
    // Already E.164. Accept only +49...
    if (!digits.startsWith("+49")) return null;
    const rest = digits.slice(3);
    if (!/^\d{7,12}$/.test(rest)) return null;
    return `+49${rest}`;
  }
  // National formats like 030..., 0151..., 0160...
  const stripped = input.replace(/\D/g, "");
  if (stripped.startsWith("0")) {
    const rest = stripped.replace(/^0+/, "");
    if (!/^\d{7,12}$/.test(rest)) return null;
    return `+49${rest}`;
  }
  return null;
}

export default function PhoneCallPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [toNumber, setToNumber] = useState<string>("+491729859252");
  // const [toNumber, setToNumber] = useState<string>("+4915226152501");

  const [loading, setLoading] = useState<"idle" | "dialing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const normalized = useMemo(() => normalizeGermanNumber(toNumber), [toNumber]);
  const canAct = selectedScenarioId != null && normalized != null && loading === "idle";

  async function startCall() {
    if (!selectedScenarioId || !normalized) return;
    setError(null);
    setLoading("dialing");
    try {
      const res = await apiFetch(`/telnyx/call`, {
        method: "POST",
        body: JSON.stringify({ to_number: normalized, scenario_id: selectedScenarioId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: StartCallResponse = await res.json();
      navigate("/dashboard/active-call", {
        state: { scenarioId: selectedScenarioId, result: data },
      });
    } catch (e: any) {
      setError(e?.message || "Call failed");
    } finally {
      setLoading("idle");
    }
  }

  return (
    <section className="space-y-6">
      {/* Step Indicator */}
      <div className='flex flex-row w-full justify-center'>
          <HorizontalSteps
            currentStep={currentStep - 1}
            onStepChange={(idx) => setCurrentStep((idx + 1) as 1 | 2)}
            steps={[
              {
                title: "Scenario",
              },
              {
                title: "Dialing",
              },
            ]}
            className="justify-center w-[500px]"
          />
        </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-row justify-between items-center w-full">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Choose your scenario</h2>
                <p className="text-sm text-default-500">Select a prank scenario from your collection</p>
              </div>
              <Button
                color="primary"
                isDisabled={!selectedScenarioId}
                onPress={() => setCurrentStep(2)}
                endContent={<span>→</span>}
              >
                Continue
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <ScenarioGridSelect
              selectedId={selectedScenarioId ?? undefined}
              disabled={loading !== "idle"}
              onSelect={(s) => {
                setSelectedScenarioId(s.id);
                setSelectedScenario(s);
              }}
            />
          </CardBody>
        </Card>
      )}

      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >


          <Card className="max-h-[500px] overflow-y-auto">
            <CardHeader>
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">Scenario Preview</h3>
                <p className="text-sm text-default-500">Voice lines that will be used</p>
              </div>
            </CardHeader>
            <CardBody>
              {selectedScenario ? (
                <div className="space-y-3">
                  {selectedScenario.description && (
                    <div className="p-3 rounded-lg bg-default-50">
                      <div className="text-xs text-default-500 mb-1">Description</div>
                      <div className="text-sm">{selectedScenario.description}</div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {["OPENING", "QUESTION", "RESPONSE", "CLOSING", "FILLER"].map((type) => {
                      const lines = selectedScenario.voice_lines?.filter((vl) => vl.type === type) ?? [];
                      if (lines.length === 0) return null;
                      return (
                        <div key={type} className="border border-default-200 rounded-lg p-3">
                          <div className="text-xs font-medium text-default-600 mb-2">{type}</div>
                          <div className="space-y-1">
                            {lines.slice(0, 3).map((vl) => (
                              <div key={vl.id} className="text-sm text-default-700">• {vl.text}</div>
                            ))}
                            {lines.length > 3 && (
                              <div className="text-xs text-default-500">...and {lines.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-default-500 text-sm">No scenario selected</div>
              )}
            </CardBody>
          </Card>

          <Card className="max-h-[500px] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Call Details</h2>

                </div>
                <p className="text-sm text-default-500">Enter the phone number to call</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {selectedScenario && (
                <div className="p-4 rounded-lg bg-default-50 border border-default-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-default-500 mb-1">Selected Scenario</div>
                      <div className="font-semibold">{selectedScenario.title}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Chip size="sm" variant="flat">{selectedScenario.language}</Chip>
                        <Chip size="sm" variant="flat" color={selectedScenario.is_safe ? "success" : "danger"}>
                          {selectedScenario.is_safe ? "Safe" : "Unsafe"}
                        </Chip>
                        <span className="text-xs text-default-500">
                          {selectedScenario.voice_lines?.length ?? 0} voice lines
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Input
                label="German Phone Number"
                placeholder="e.g. 0301234567 or +49301234567"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                description={normalized ? `Will dial: ${normalized}` : "Enter a valid German (+49) number"}
                isInvalid={toNumber.length > 0 && !normalized}
                isDisabled={loading !== "idle"}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">🇩🇪</span>
                  </div>
                }
              />

              <div className="flex gap-2 pt-4 justify-end h-full items-end">
                <Button
                  color="primary"
                  onPress={startCall}
                  isDisabled={!canAct}
                  isLoading={loading === "dialing"}
                  className="font-semibold"
                  startContent={loading !== "dialing" && <span></span>}
                >
                {loading === "dialing" ? "Dialing..." : "Start Call"}
                </Button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
                  <div className="text-danger text-sm">{error}</div>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      )}
    </section>
  );
}
