

import { useEffect, useRef, useState } from "react";
import { Button, Spinner, Chip, Switch } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import MessageCard from "@/components/ai/MessageCard";
import PromptInputFullLine from "@/components/ai/PromptInputFullLine";
import { useAuth } from "@/context/AuthProvider";
import { DesignChatWebSocket } from "@/lib/api.design-chat";
import { processScenario } from "@/lib/api.scenarios";
import type { DesignChatMessage, DesignChatResponse } from "@/types/design-chat";
import { CheckCircleIcon, SparklesIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/icons";

type ChatWindowProps = {
  onExpand?: () => void;
  onStartTyping?: () => void;
};

export default function ChatWindow({ onExpand, onStartTyping }: ChatWindowProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || user?.email || "You";
  const userAvatar = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || undefined;
  
  const [messages, setMessages] = useState<DesignChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  
  // Design chat state
  const [isReady, setIsReady] = useState(false);
  const [missingAspects, setMissingAspects] = useState<string[]>([]);
  const [currentDraft, setCurrentDraft] = useState("");
  const [targetName, setTargetName] = useState<string>();
  const [scenarioTitle, setScenarioTitle] = useState<string>();
  const [showDetails, setShowDetails] = useState(false);
  
  const wsRef = useRef<DesignChatWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasStarted = messages.length > 0;
  
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
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
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
      setIsReady(data.is_ready || false);
      setMissingAspects(data.missing || []);
      if (data.draft && data.draft.length > 50) {  // Only show draft if it's substantial
        setCurrentDraft(data.draft);
      }
      setTargetName(data.target_name || undefined);
      setScenarioTitle(data.title || undefined);
      
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
    setIsGenerating(true);
    setError(null);
    
    try {
      // Generate scenario using the main processor
      const response = await processScenario({
        scenario: {
          title: scenarioTitle || 'Prank aus Chat',
          target_name: targetName || 'Unbekannt',
          description: description,
          language: 'GERMAN'
        }
      });
      
      if (response.status === 'complete' && response.scenario_id) {
        // Success message
        const successMessage: DesignChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🎉 Perfekt! Dein Szenario "${scenarioTitle || 'Prank'}" wurde erstellt! Du wirst gleich weitergeleitet...`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Navigate after short delay
        setTimeout(() => {
          navigate(`/dashboard/scenarios/${response.scenario_id}`);
        }, 2000);
      } else if (response.status === 'error') {
        setError(response.error || 'Fehler beim Generieren des Szenarios.');
      }
    } catch (error) {
      console.error('Failed to generate scenario:', error);
      setError('Konnte Szenario nicht generieren. Bitte versuche es erneut.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleFinalize = () => {
    if (wsRef.current?.isConnected()) {
      wsRef.current.finalize();
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Chat Container with Border */}
      <div className="bg-background/60 backdrop-blur-md border border-divider rounded-2xl shadow-lg">
        {/* Messages Area */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
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
              <div className="flex items-center ml-12 text-default-400">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-default-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h- bg-default-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h- bg-default-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Toggle Details Button */}
        {hasStarted && currentDraft && (
          <div className="px-6 py-2 border-t border-divider">
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
        
        {/* Current Draft Preview - Only show when toggled */}
        {showDetails && currentDraft && hasStarted && (
          <div className="px-6 py-3 bg-primary-50/50 border-t border-divider">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-primary-600 font-medium">Aktueller Entwurf:</p>
              {isReady && (
                <Chip
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<CheckCircleIcon className="w-3 h-3" />}
                >
                  Bereit
                </Chip>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{currentDraft}</p>
            {targetName && (
              <p className="text-xs text-default-500 mt-2">Ziel: {targetName}</p>
            )}
          </div>
        )}
        
        {/* Input Area */}
        <div className="p-4 border-t border-divider">
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
              disabled={isGenerating || isConnecting}
              placeholder={
                hasStarted 
                  ? "Schreibe deine Antwort..." 
                  : "Beschreibe deine Prank-Idee..."
              }
            />
          </div>
          
          {/* Generate Button - Show when there's content */}
          {hasStarted && currentDraft && (
            <div className="mt-3">
              <Button
                color="primary"
                size="md"
                fullWidth
                onClick={handleFinalize}
                isLoading={isGenerating}
                startContent={!isGenerating && <SparklesIcon className="w-5 h-5" />}
                className="bg-gradient-primary"
              >
                {isGenerating ? 'Szenario wird generiert...' : 'Szenario jetzt erstellen'}
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
    </div>
  );
}