import { useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import MessageCard from "@/components/ai/MessageCard";
import { Logo } from "@/components/icons";
import PromptInputFullLine from "@/components/ai/PromptInputFullLine";
import { useAuth } from "@/context/AuthProvider";
import { processScenario, fetchScenario } from "@/lib/api.scenarios";
import type { ScenarioProcessResponse } from "@/types/scenario";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; ts: number };

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatWindow() {
  const { user } = useAuth();
  const userName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || user?.email || "You";
  const userAvatar = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || undefined;
  const saved = typeof window !== "undefined" ? localStorage.getItem("initialPrompt") || "" : "";
  const [initialInput, setInitialInput] = useState<string>(saved);
  const [answerInput, setAnswerInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [waiting, setWaiting] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const hasAssistant = useMemo(() => messages.some(m => m.role === "assistant"), [messages]);
  const initialSent = useMemo(() => messages.find(m => m.role === "user"), [messages]);

  useEffect(() => {
    if (saved && !initialInput) setInitialInput(saved);
  }, [saved]);

  function formatClarifying(q: ScenarioProcessResponse["clarifying_questions"]) {
    if (!q) return "";
    return Array.isArray(q) ? q.join("\n") : q;
  }

  async function submitInitial() {
    const content = initialInput.trim();
    if (!content || waiting || messages.length > 0) return;

    const userMsg: Message = { id: genId(), role: "user", content, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setWaiting(true);

    try {
      const resp = await processScenario({
        scenario: {
          title: "Draft from chat",
          target_name: "Unknown",
          description: content,
          language: "GERMAN",
        },
      });

      if (resp.status === "needs_clarification") {
        setSessionId(resp.session_id || null);
        const aiText = formatClarifying(resp.clarifying_questions) || "Please provide a bit more detail.";
        const ai: Message = { id: genId(), role: "assistant", content: aiText, ts: Date.now() };
        setMessages(prev => [...prev, ai]);
      } else if (resp.status === "complete" && resp.scenario_id) {
        const scenario = await fetchScenario(resp.scenario_id);
        const aiText = `Scenario created: "${scenario.title}" (ID: ${scenario.id}). View it under Scenarios.`;
        const ai: Message = { id: genId(), role: "assistant", content: aiText, ts: Date.now() };
        setMessages(prev => [...prev, ai]);
        setFinished(true);
      } else if (resp.status === "error") {
        const ai: Message = { id: genId(), role: "assistant", content: `Error: ${resp.error || "Unknown error"}`, ts: Date.now() };
        setMessages(prev => [...prev, ai]);
        setFinished(true);
      }
    } catch (err) {
      const ai: Message = { id: genId(), role: "assistant", content: `Request failed: ${err instanceof Error ? err.message : String(err)}`, ts: Date.now() };
      setMessages(prev => [...prev, ai]);
      setFinished(true);
    } finally {
      setWaiting(false);
    }
  }

  async function submitAnswer() {
    const content = answerInput.trim();
    if (!content || waiting || finished || !hasAssistant || !sessionId) return;

    const userMsg: Message = { id: genId(), role: "user", content, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setWaiting(true);

    try {
      const resp = await processScenario({
        session_id: sessionId,
        clarifications: content,
      });

      if (resp.status === "complete" && resp.scenario_id) {
        const scenario = await fetchScenario(resp.scenario_id);
        const aiText = `Scenario created: "${scenario.title}" (ID: ${scenario.id}). View it under Scenarios.`;
        const ai: Message = { id: genId(), role: "assistant", content: aiText, ts: Date.now() };
        setMessages(prev => [...prev, ai]);
        setFinished(true);
      } else if (resp.status === "needs_clarification") {
        // If backend ever asks again, show new clarifying text and keep going
        const aiText = formatClarifying(resp.clarifying_questions) || "Please provide more detail.";
        const ai: Message = { id: genId(), role: "assistant", content: aiText, ts: Date.now() };
        setMessages(prev => [...prev, ai]);
      } else if (resp.status === "error") {
        const ai: Message = { id: genId(), role: "assistant", content: `Error: ${resp.error || "Unknown error"}`, ts: Date.now() };
        setMessages(prev => [...prev, ai]);
        setFinished(true);
      }
    } catch (err) {
      const ai: Message = { id: genId(), role: "assistant", content: `Request failed: ${err instanceof Error ? err.message : String(err)}`, ts: Date.now() };
      setMessages(prev => [...prev, ai]);
      setFinished(true);
    } finally {
      setWaiting(false);
    }
  }

  function replacePrompt() {
    localStorage.removeItem("initialPrompt");
    setInitialInput("");
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-3xl border border-purple-300/30 dark:border-purple-800/30 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl shadow-xl shadow-primary-500/20">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">Chat</h2>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto p-2 rounded-xl bg-white/30 dark:bg-gray-900/30 border border-white/20 dark:border-white/5">
            {!initialSent && !!saved && (
              <MessageCard
                side="left"
                avatarNode={<Logo size={30} />}
                message={
                  <div className="space-y-3">
                    <div className="text-xs text-default-500">We found your prompt from the landing page:</div>
                    <div className="text-sm whitespace-pre-wrap rounded-medium bg-default-100/70 dark:bg-default-100/10 border border-default-200/50 p-3">
                      {saved}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" color="primary" onPress={submitInitial} isDisabled={!initialInput.trim() || waiting}>
                        Use as-is
                      </Button>
                      <Button size="sm" variant="flat" onPress={replacePrompt} isDisabled={waiting}>
                        Replace
                      </Button>
                    </div>
                  </div>
                }
                status={"success"}
              />
            )}
            {messages.map(m => (
              <MessageCard
                key={m.id}
                side={m.role === "user" ? "right" : "left"}
                avatar={m.role === "user" ? userAvatar : undefined}
                avatarName={m.role === "user" ? userName : undefined}
                avatarNode={m.role === "assistant" ? <Logo size={36} /> : undefined}
                message={
                  <>
                    <div className="text-xs mb-1 text-default-500">{m.role === "user" ? "You" : "AI"}</div>
                    <div>{m.content}</div>
                  </>
                }
                status={"success"}
              />
            ))}
            {waiting && (
              <div className="flex items-center gap-2 text-default-500 text-sm px-1 py-2">
                <Spinner size="sm" /> Waiting for AI response…
              </div>
            )}
            {!messages.length && (
              <div className="text-xs text-default-500 px-2 py-1">No messages yet</div>
            )}
          </div>

          {!initialSent && (
            <PromptInputFullLine
              value={initialInput}
              onChange={setInitialInput}
              onSubmit={submitInitial}
              disabled={waiting}
              placeholder="Describe your prank scenario..."
            />
          )}

          {hasAssistant && !finished && (
            <PromptInputFullLine
              value={answerInput}
              onChange={setAnswerInput}
              onSubmit={submitAnswer}
              disabled={waiting}
              placeholder="Provide the details the AI asked for…"
            />
          )}

          {finished && (
            <div className="text-sm text-default-500">
              Conversation finished. You can Reset to start over.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}