import { apiFetch } from "@/lib/api";
import type { Language } from "@/types/scenario";

export interface TTSResult {
  voice_line_id: number;
  success: boolean;
  signed_url?: string;
  storage_path?: string;
  error_message?: string;
}

export interface SingleTTSRequest {
  voice_line_id: number;
  voice_id?: string;
  language?: Language;
  gender?: "MALE" | "FEMALE";
  model?: string;
}

export async function generateSingleTTS(payload: SingleTTSRequest): Promise<TTSResult> {
  const res = await apiFetch(`/tts/generate/single`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getAudioUrl(voice_line_id: number): Promise<{ signed_url: string; expires_in: number }> {
  const res = await apiFetch(`/tts/audio-url/${voice_line_id}`, { method: "GET" });
  return res.json();
}


