export type Language = "ENGLISH" | "GERMAN";

export type VoiceLineType = "OPENING" | "QUESTION" | "RESPONSE" | "CLOSING" | "FILLER";

export interface VoiceLineAudio {
  id: number;
  voice_id: string;
  storage_path: string;
  signed_url?: string | null;
  duration_ms?: number | null;
  size_bytes?: number | null;
  created_at: string;
}

export interface VoiceLine {
  id: number;
  text: string;
  type: VoiceLineType;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Audio information for the preferred voice (if available)
  preferred_audio?: VoiceLineAudio | null;
}

// Scenario analysis typing
export type SafetyRecommendation = "allow" | "modify" | "review" | "reject";

export interface ScenarioPersonaAnalysis {
  persona_name: string;
  persona_gender: "MALE" | "FEMALE";
  company_service: string;
  conversation_goals: string[];
  believability_anchors: string[];
  escalation_plan: string[];
  cultural_context: string;
  voice_hints?: string | null;
}

export interface ScenarioSafetyAnalysis {
  issues: string[];
  recommendation: SafetyRecommendation;
  reasoning: string;
  confidence: number;
}

export interface ScenarioAnalysisPayload {
  analysis?: ScenarioPersonaAnalysis;
  safety?: ScenarioSafetyAnalysis;
}

export interface Scenario {
  id: number;
  title: string;
  description?: string | null;
  language: Language;
  preferred_voice_id?: string | null;
  target_name?: string | null;
  scenario_analysis?: ScenarioAnalysisPayload | null;
  is_safe: boolean;
  is_not_safe_reason?: string | null;
  is_public: boolean;
  is_active: boolean;
  voice_lines: VoiceLine[];
  created_at: string;
  updated_at: string;
}

export interface ScenarioCreateRequest {
  title: string;
  target_name: string;
  description?: string;
  language?: Language; // Backend default is GERMAN when omitted
}

export interface ScenarioCreateResponse {
  scenario: Scenario;
  processing_summary: Record<string, unknown>;
}

export interface ScenarioProcessRequest {
  scenario?: ScenarioCreateRequest;
  session_id?: string;
  clarifying_questions?: string | string[];
  clarifications?: string | string[];
}

export interface ScenarioProcessResponse {
  status: 'needs_clarification' | 'complete' | 'error';
  session_id?: string;
  clarifying_questions?: string | string[];
  scenario_id?: number;
  error?: string;
}

export interface VoiceLineEnhancementRequest {
  voice_line_ids: number[];
  user_feedback: string;
}

export interface VoiceLineEnhancementItemResult {
  voice_line_id: number;
  original_text: string;
  enhanced_text?: string;
  error?: string;
  safety_passed: boolean;
  safety_issues: string[];
}

export interface VoiceLineEnhancementResponse {
  success: boolean;
  total_processed: number;
  successful_count: number;
  failed_count: number;
  successful_enhancements: VoiceLineEnhancementItemResult[];
  failed_enhancements: VoiceLineEnhancementItemResult[];
  user_feedback: string;
}


