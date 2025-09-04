import { useCallback, useState } from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import ChatWindow from "@/components/chat/ChatWindow";

type Props = {
  onExpand?: () => void;
};

export default function ChatWindowWrapper({ onExpand }: Props) {
  const [hasUserInput, setHasUserInput] = useState<boolean>(false);

  const handleUserActivity = useCallback(() => {
    if (!hasUserInput) {
      setHasUserInput(true);
      try { onExpand && onExpand(); } catch {}
    }
  }, [hasUserInput, onExpand]);

  return (
    <div className="w-full max-w-6xl mx-auto  flex flex-col h-full items-center justify-center gap-8">
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

      <ChatWindow onExpand={handleUserActivity} onStartTyping={handleUserActivity} />
    </div>
  );
}

