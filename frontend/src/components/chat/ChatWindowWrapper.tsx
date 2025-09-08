import { useCallback, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import ScenarioLoadingIndicator from "@/components/ScenarioLoadingIndicator";

type Props = {
  onExpand?: () => void;
};

export default function ChatWindowWrapper({ onExpand }: Props) {
  const [hasUserInput, setHasUserInput] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUserActivity = useCallback(() => {
    if (!hasUserInput) {
      setHasUserInput(true);
      try { onExpand && onExpand(); } catch {}
    }
  }, [hasUserInput, onExpand]);

  // Handler for scenario creation result
  const handleScenarioResult = (result: { status: string; scenario_id?: number; error?: string }) => {
    setLoading(false);
    if (result.status === 'complete' && result.scenario_id) {
      window.location.href = `/dashboard/scenarios/${result.scenario_id}`;
    } else if (result.status === 'error') {
      setError(result.error || 'Fehler beim Generieren des Szenarios.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 h-full min-h-0 overflow-hidden items-center justify-center gap-6 py-6">
      {loading ? (
        <ScenarioLoadingIndicator />
      ) : (
        <>
          <div className="flex flex-col items-center text-center">
            <div
              className={[
                "transition-all duration-500 ease-out",
                hasUserInput ? "opacity-0 -translate-y-3 h-0 mb-0 pointer-events-none" : "opacity-100 translate-y-0 mb-6",
              ].join(" ")}
            >
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient">
                Entwirf deinen persönlichen Prank
              </h1>
              <p className="mt-2 text-default-500 max-w-2xl">
                Beschreibe dein Szenario oder wähle eine Vorlage – wir helfen beim Feinschliff.
              </p>
            </div>
          </div>
          {error && (
            <div className="bg-danger-50 text-danger p-3 rounded-lg text-sm mb-4">{error}</div>
          )}
          <ChatWindow
            onExpand={handleUserActivity}
            onStartTyping={handleUserActivity}
            loading={loading}
            setLoading={setLoading}
            onScenarioResult={handleScenarioResult}
            onReset={() => {
              setHasUserInput(false);
              setError(null);
            }}
          />
        </>
      )}
    </div>
  );
}

