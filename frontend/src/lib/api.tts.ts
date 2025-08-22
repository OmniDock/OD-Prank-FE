import { apiFetch } from "@/lib/api";
import type { Language } from "@/types/scenario";
import type { VoiceListResponse } from "@/types/tts";

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

export async function getAudioUrl(voice_line_id: number, voice_id?: string): Promise<{ signed_url: string; expires_in: number }> {
  const query = voice_id ? `?voice_id=${encodeURIComponent(voice_id)}` : "";
  const res = await apiFetch(`/tts/audio-url/${voice_line_id}${query}`, { method: "GET" });
  return res.json();
}

export async function fetchVoices(): Promise<VoiceListResponse> {
  const res = await apiFetch(`/tts/voices`, { method: "GET" });
  return res.json();
}


