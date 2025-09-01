import { apiFetch } from "@/lib/api";
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
  model?: string;
}

export type AudioUrlResponse =
  | { status: "PENDING"; signed_url?: undefined; expires_in?: undefined }
  | { status?: "READY"; signed_url: string; expires_in: number };

export async function generateSingleTTS(payload: SingleTTSRequest): Promise<TTSResult> {
  const res = await apiFetch(`/tts/generate/single`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getAudioUrl(voice_line_id: number, voice_id?: string): Promise<AudioUrlResponse> {
  const query = voice_id ? `?voice_id=${encodeURIComponent(voice_id)}` : "";
  const res = await apiFetch(`/tts/audio-url/${voice_line_id}${query}`, { method: "GET" });
  return res.json();
}

export async function fetchVoices(): Promise<VoiceListResponse> {
  const res = await apiFetch(`/tts/voices`, { method: "GET" });
  return res.json();
}

export interface VoiceLinesSummaryItem {
  voice_line_id: number;
  status: string | null;
  signed_url?: string | null;
  storage_path?: string | null;
  updated_at?: string | null;
}

export interface VoiceLinesSummaryResponse {
  items: VoiceLinesSummaryItem[];
}

export async function fetchVoiceLinesSummary(scenario_id: number, etag?: string): Promise<{ notModified: boolean; etag?: string; data?: VoiceLinesSummaryResponse }>{
  const res = await apiFetch(`/voice-lines/summary?scenario_id=${encodeURIComponent(String(scenario_id))}`, {
    method: "GET",
    headers: etag ? { "If-None-Match": etag } : undefined,
  });
  if (res.status === 304) {
    return { notModified: true };
  }
  const newEtag = res.headers.get("ETag") || undefined;
  const data = (await res.json()) as VoiceLinesSummaryResponse;
  return { notModified: false, etag: newEtag, data };
}


