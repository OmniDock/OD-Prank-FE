export interface TTSResult {
  voice_line_id: number;
  success: boolean;
  signed_url?: string;
  storage_path?: string;
  error_message?: string;
}

export type Gender = "MALE" | "FEMALE";

export interface VoiceItem {
  id: string;
  name: string;
  description?: string;
  languages: ("ENGLISH" | "GERMAN")[];
  gender: Gender;
  preview_url?: string;
  avatar_url?: string;
}

export interface VoiceListResponse {
  voices: VoiceItem[];
}


