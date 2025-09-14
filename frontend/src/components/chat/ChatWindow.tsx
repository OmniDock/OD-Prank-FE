

import { useEffect, useRef, useState } from "react";
import { Button, Spinner, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import MessageCard from "@/components/ai/MessageCard";
import PromptInputFullLine from "@/components/ai/PromptInputFullLine";
import { useAuth } from "@/context/AuthProvider";
import { DesignChatWebSocket } from "@/lib/api.design-chat";
import type { DesignChatMessage } from "@/types/design-chat";
import { SparklesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/icons";
import { apiFetch } from "@/lib/api";

interface ChatWindowProps {
  onExpand?: () => void;
  onStartTyping?: () => void;
  loading?: boolean;
  setLoading?: (val: boolean) => void;
  onScenarioResult?: (result: { status: string; scenario_id?: number; error?: string }) => void;
  onReset?: () => void;
}

export default function ChatWindow({ onExpand, onStartTyping, loading, setLoading, onScenarioResult, onReset }: ChatWindowProps = {}) {
  const { user } = useAuth();
  const userName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || user?.email || "You";
  const userAvatar = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || undefined;
  
  const [messages, setMessages] = useState<DesignChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  
  // Design chat state
  const [currentDraft, setCurrentDraft] = useState("");
  // const [showDetails, setShowDetails] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const wsRef = useRef<DesignChatWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasInjectedInitialPromptRef = useRef<boolean>(false);
  const hasStarted = messages.length > 0;
  const hasUserMessage = messages.some((m) => m.role === 'user');
  
  // Auto-connect when user starts typing or on mount
  useEffect(() => {
    if (!wsRef.current && !isConnecting) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, []);
  
  // Hydrate chat history from backend (Redis) on mount
  useEffect(() => {
    (async () => {
      try {
        const response = await apiFetch("/design-chat/history");
        const data = await response.json();
        const state = (data && data.state) || {};
        const msgs = Array.isArray(state.messages) ? state.messages : [];
        if (msgs.length) {
          setMessages(
            msgs.map((m: any, idx: number) => ({
              id: `${Date.now()}_${idx}`,
              role: m.role === 'user' ? 'user' : 'assistant',
              content: String(m.content || ''),
              timestamp: Date.now() + idx,
            }))
          );
          // Hide header if history exists
          try { onStartTyping && onStartTyping(); } catch {}
        }
        if (typeof state.scenario === 'string' && state.scenario.length > 0) {
          setCurrentDraft(state.scenario);
        }
      } catch (e) {
        // Ignore hydration errors silently
      }
    })();
  }, []);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Inject saved initial prompt from landing page after login
  useEffect(() => {
    try {
      if (hasInjectedInitialPromptRef.current) return;
      const saved = localStorage.getItem("initialPrompt");
      if (saved && saved.trim()) {
        hasInjectedInitialPromptRef.current = true;
        setInput(saved);
        // Auto-send the saved message so it appears in chat history
        handleSendMessage(saved);
        localStorage.removeItem("initialPrompt");
      }
    } catch {}
  }, []);
  
  const connectWebSocket = async () => {
    if (wsRef.current?.isConnected()) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const ws = new DesignChatWebSocket();
      
      await ws.connect(
        handleWebSocketMessage,
        (error) => {
          console.error('WebSocket error:', error);
          setError('Verbindung verloren. Bitte Seite neu laden.');
          setIsConnected(false);
        },
        () => {
          console.log('WebSocket closed');
          setIsConnected(false);
        }
      );
      
      wsRef.current = ws;
      setIsConnected(true);
      
      // Initial greeting will come from backend
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Konnte keine Verbindung herstellen. Bitte versuche es später erneut.');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'typing') {
      // Show/hide typing indicator
      setIsAiTyping(data.status === 'start');
      setStreamingMessage("");
      
    } else if (data.type === 'stream') {
      // Handle streaming content
      setStreamingMessage(prev => prev + (data.content || ""));
      setIsAiTyping(true);
      
    } else if (data.type === 'response') {
      // Final response - add complete message
      const finalMessage = data.suggestion || streamingMessage;
      
      if (finalMessage) {
        setMessages(prev => {
          // Check for duplicates using the current state
          const isDuplicate = prev.some(msg => 
            msg.role === 'assistant' && msg.content === finalMessage
          );
          
          if (!isDuplicate) {
            const assistantMessage: DesignChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: finalMessage,
              timestamp: Date.now()
            };
            return [...prev, assistantMessage];
          }
          return prev;
        });
      }
      
      // Clear streaming message and hide typing indicator
      setStreamingMessage("");
      setIsAiTyping(false);
      
      // Update state only if there's meaningful content
      if (data.draft && data.draft.length > 50) {  // Only show draft if it's substantial
        setCurrentDraft(data.draft);
      }
      
    } else if (data.type === 'finalized') {
      // Scenario is ready, now generate it
      handleGenerateScenario(data.description || currentDraft);
      
    } else if (data.type === 'error') {
      setError(data.message || 'Ein Fehler ist aufgetreten.');
      setIsAiTyping(false);
      setStreamingMessage("");
    }
  };
  
  const handleSendMessage = async (content?: string) => {
    const messageContent = (content || input).trim();
    if (!messageContent) return;
    
    // Expand on first message
    if (!hasStarted) {
      try { onExpand && onExpand(); } catch {}
    }
    
    // Ensure connected
    if (!wsRef.current?.isConnected()) {
      await connectWebSocket();
      // Wait a bit for connection
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!wsRef.current?.isConnected()) {
      setError('Keine Verbindung. Bitte versuche es erneut.');
      return;
    }
    
    // Add user message to UI
    const userMessage: DesignChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to WebSocket
    wsRef.current.sendMessage(messageContent);
    
    // Clear input and show typing indicator
    setInput('');
    setIsAiTyping(true);
  };
  
  const handleGenerateScenario = async (description: string) => {
    if (setLoading) setLoading(true);
    setError(null);
    try {
      // Generate scenario using the main processor (REST)
      const response = await apiFetch("/scenario/process/chat", {
        method: "POST",
        body: JSON.stringify({ description }),
      });
      const data = await response.json();
      if (onScenarioResult) onScenarioResult(data);
    } catch (error) {
      if (onScenarioResult) onScenarioResult({ status: 'error', error: 'Konnte Szenario nicht generieren. Bitte versuche es erneut.' });
    } finally {
      if (setLoading) setLoading(false);
    }
  };
  
  const handleFinalize = () => {
    // Instead of WebSocket finalize, use REST
    handleGenerateScenario(currentDraft || "");
  };
  
  const handleResetChat = async () => {
    try {
      // Clear persisted state on backend
      try {
        await apiFetch("/design-chat/history", { method: "DELETE" });
      } catch {}
      // Disconnect current WS and reset local state
      try { wsRef.current?.disconnect(); } catch {}
      wsRef.current = null;
      setMessages([]);
      setInput("");
      setStreamingMessage("");
      setIsAiTyping(false);
      setError(null);
      setIsConnected(false);
      setIsConnecting(false);
      setCurrentDraft("");
      // setShowDetails(false);
      try { onReset && onReset(); } catch {}
      // Reconnect fresh (will send greeting)
      await connectWebSocket();
    } catch {} finally {
      setIsConfirmOpen(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto max-h-full ">
      {/* Chat Container with Border */}
      <div className="bg-background/60 backdrop-blur-md border border-divider rounded-2xl shadow-lg flex flex-col h-full min-h-0 overflow-hidden">
        {/* Scrollable Content (messages + optional details) */}
        <div className="flex-1 min-h-0 px-6 pt-6 overflow-y-auto scrollbar-hide">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              avatar={message.role === 'user' ? userAvatar : undefined}
              avatarName={message.role === 'user' ? userName : 'AI'}
              avatarNode={message.role === 'assistant' ? <Logo size={32} /> : undefined}
              message={message.content}
              side={message.role === 'user' ? 'right' : 'left'}
            />
          ))}
          
          {/* Streaming Message or Typing Indicator */}
          {(isAiTyping || streamingMessage) && (
            streamingMessage ? (
              <MessageCard
                avatarNode={<Logo size={32} />}
                avatarName="AI"
                message={streamingMessage}
                side="left"
              />
            ) : (
              <div className="flex items-center ml-12 mb-3 text-default-400">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-default-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h- bg-default-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h- bg-default-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )
          )}
          
          {isConnecting && (
            <div className="flex justify-center py-4">
              <Spinner size="sm" label="Verbinde..." />
            </div>
          )}
          
          {error && (
            <div className="bg-danger-50 text-danger p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* {hasStarted && currentDraft && (
            <div className="px-6 py-2 -mx-6 border-t border-divider">
              <div className="flex items-center justify-between">
                <span className="text-sm text-default-500">Szenario-Entwurf anzeigen</span>
                <Switch
                  size="sm"
                  isSelected={showDetails}
                  onValueChange={setShowDetails}
                  startContent={<EyeIcon className="w-3 h-3" />}
                  endContent={<EyeSlashIcon className="w-3 h-3" />}
                />
              </div>
            </div>
          )}
          
          {showDetails && currentDraft && hasStarted && (
            <div className="px-6 py-3 -mx-6 bg-primary-50/50 border-divider ">
              <div className="flex items-center justify-between">
                <p className="text-xs text-primary-600 font-medium">Aktueller Entwurf:</p>
              </div>
              <p className="text-sm whitespace-pre-wrap">{currentDraft}</p>
            </div>
          )} */}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area (always visible) */}
        <div className="px-4 py-3  border-divider shrink-0">
          <div className="flex gap-2">
            <PromptInputFullLine
              value={input}
              onChange={(value) => {
                setInput(value);
                // Hide header when user starts typing
                if (value && onStartTyping) {
                  onStartTyping();
                }
              }}
              onSubmit={() => handleSendMessage()}
              disabled={loading}
              placeholder={
                hasStarted 
                  ? "Schreibe deine Antwort..." 
                  : "Beschreibe deine Prank-Idee..."
              }
              onResetPress={(hasStarted || !!streamingMessage) ? () => setIsConfirmOpen(true) : undefined}
            />
          </div>
          
          {/* Generate Button - Show only after first user message */}
          {hasUserMessage && (
            <div className="mt-3">
              <Button
                color="primary"
                size="md"
                fullWidth
                onClick={handleFinalize}
                isLoading={loading}
                startContent={!loading && <SparklesIcon className="w-5 h-5" />}
                className="bg-gradient-primary"
                disabled={loading}
              >
                {loading ? 'Szenario wird generiert...' : 'Szenario jetzt erstellen'}
              </Button>
            </div>
          )}
          
          {/* Connection Status */}
          {!isConnected && !isConnecting && hasStarted && (
            <div className="mt-2 text-xs text-warning">
              Nicht verbunden. 
              <Button
                size="sm"
                variant="light"
                onClick={connectWebSocket}
                className="ml-2"
              >
                Erneut verbinden
              </Button>
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <ModalContent>
          <ModalHeader>Reset Chat</ModalHeader>
          <ModalBody>
            Are you sure you want to reset the chat? This will clear the conversation and draft.
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleResetChat} startContent={<ArrowPathIcon className="w-4 h-4" />}>
              Reset Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}