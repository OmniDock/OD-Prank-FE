export type Language = "ENGLISH" | "GERMAN";

export type VoiceLineType = "OPENING" | "QUESTION" | "RESPONSE" | "CLOSING";

export interface VoiceLine {
  id: number;
  text: string;
  type: VoiceLineType;
  order_index: number;
  storage_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: number;
  title: string;
  description?: string | null;
  language: Language;
  target_name: string;
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


