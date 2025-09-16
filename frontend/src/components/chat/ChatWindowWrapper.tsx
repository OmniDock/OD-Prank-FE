import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatWindow from "@/components/chat/ChatWindow";
import ScenarioLoadingIndicator from "@/components/LoadingScreen";
import { getCredits } from "@/lib/api.profile";
import { Button } from "@heroui/react";


type Props = {
  onExpand?: () => void;
};

export default function ChatWindowWrapper({ onExpand }: Props) {
  const navigate = useNavigate();
  const [hasUserInput, setHasUserInput] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prankCredits, setPrankCredits] = useState<number | null>(null);
  const [creditsError, setCreditsError] = useState<boolean>(false);

  // Fetch credits on component mount
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        console.log('Fetching credits...');
        const creditsData = await getCredits();
        console.log('Credits API response:', creditsData);
        setPrankCredits(creditsData.prank_credit_amount || 0);
        console.log('Set prankCredits to:', creditsData.prank_credit_amount || 0);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
        setPrankCredits(0);
        setCreditsError(true);
        console.log('Set prankCredits to 0 due to error');
      }
    };
    fetchCredits();
  }, []);

  const handleUserActivity = useCallback(() => {
    if (!hasUserInput && prankCredits !== null && prankCredits > 0) {
      setHasUserInput(true);
      try { onExpand && onExpand(); } catch {}
    }
  }, [hasUserInput, onExpand, prankCredits]);

  // Handler for scenario creation result
  const handleScenarioResult = (result: { status: string; scenario_id?: number; error?: string }) => {
    setLoading(false);
    if (result.status === 'complete' && result.scenario_id) {
      window.location.href = `/dashboard/scenarios/${result.scenario_id}`;
    } else if (result.status === 'error') {
      setError(result.error || 'Fehler beim Generieren des Szenarios.');
    }
  };

  // Check if credits are insufficient or there's an error
  const hasInsufficientCredits = prankCredits !== null && prankCredits <= 0;
  
  // Debug logging
  console.log('ChatWindowWrapper Debug:', {
    prankCredits,
    hasInsufficientCredits,
    prankCreditsIsNull: prankCredits === null,
    prankCreditsValue: prankCredits,
    creditsType: typeof prankCredits
  });

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 h-full min-h-0 overflow-hidden items-center justify-center gap-6 py-6">
      {loading ? (
        <ScenarioLoadingIndicator message="Dein Szenario wird generiert. Dies kann einige Sekunden dauern." />
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
          {hasInsufficientCredits && !creditsError && (
            <div className="bg-warning-50 text-warning-700 border border-warning-200 p-4 rounded-lg text-sm mb-4 max-w-md text-center">
              <p className="font-medium">Keine Prank-Credits verfügbar</p>
              <p className="mt-1">Du benötigst Credits, um Szenarien zu erstellen. Schließe ein Abonnement ab um Credits zu erhalten.</p>
              <Button size="sm" color="warning" onPress={() => navigate("/pricing")}>Zu den Abonnements</Button>  
            </div>
          )}
          {creditsError && (
            <div className="bg-danger-50 text-danger-700 border border-danger-200 p-4 rounded-lg text-sm mb-4 max-w-md text-center">
              <p className="font-medium">Fehler beim Laden der Credits</p>
              <p className="mt-1">Es gab ein Problem beim Laden deiner Credits. Bitte lade die Seite neu oder versuche es später erneut.</p>
            </div>
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
            disableScenarioCreation={hasInsufficientCredits || creditsError}
          />
        </>
      )}
    </div>
  );
}

