import { useCallback, useState } from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import ChatWindow from "@/components/chat/ChatWindow";

type Props = {
  onExpand?: () => void;
};

export default function ChatWindowWrapper({ onExpand }: Props) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleExpand = useCallback(() => {
    if (!expanded) {
      setExpanded(true);
      try { onExpand && onExpand(); } catch {}
    }
  }, [expanded, onExpand]);

  return (
    <div className="w-full max-w-6xl mx-auto  flex flex-col h-full items-center justify-center gap-8">
      <div className="flex flex-col items-center text-center">
        <div
          className={[
            "transition-all duration-500 ease-out",
            expanded ? "opacity-0 -translate-y-3 h-0 mb-0 pointer-events-none" : "opacity-100 translate-y-0 mb-6",
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

      <ChatWindow onExpand={handleExpand} />

      <div className="mt-6 w-full max-w-3xl">
        <div className="relative overflow-hidden rounded-2xl border border-purple-300/40 dark:border-purple-700/40 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300">
              <LightBulbIcon className="h-5 w-5" />
            </span>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">Szenario‑Tipps</div>
              <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-default-700 dark:text-default-400">
                <li>Wer wird geprankt?</li>
                <li>Kurzer Ablauf in 1–2 Sätzen</li>
                <li>1–2 echte Details (Firma, Name, Adresse)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

