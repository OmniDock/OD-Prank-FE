/**
 * Types for Design Chat feature
 */

export interface DesignChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DesignChatState {
  messages: DesignChatMessage[];
  currentDraft: string;
  isReady: boolean;
  missingAspects: string[];
  targetName?: string;
  scenarioTitle?: string;
}

export interface DesignChatResponse {
  type: 'response' | 'finalized' | 'error' | 'pong';
  suggestion?: string;
  draft?: string;
  is_ready?: boolean;
  missing?: string[];
  target_name?: string;
  title?: string;
  description?: string;
  message?: string;
}

export interface DesignChatWebSocketMessage {
  type: 'message' | 'finalize' | 'ping';
  content?: string;
}
