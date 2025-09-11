import { apiFetch } from "@/lib/api";
import type {
  Scenario,
  ScenarioCreateRequest,
  ScenarioCreateResponse,
  ScenarioProcessRequest,
  ScenarioProcessResponse,
  VoiceLineEnhancementRequest,
  VoiceLineEnhancementResponse,
} from "@/types/scenario";

export async function fetchScenarios(limit = 50, offset = 0, only_active = true): Promise<Scenario[]> {
  const res = await apiFetch(`/scenario?limit=${limit}&offset=${offset}&only_active=${only_active}`);
  return res.json();
}

export async function fetchScenario(id: string | number): Promise<Scenario> {
  const res = await apiFetch(`/scenario/${id}`);
  return res.json();
}

export async function createScenario(
  payload: ScenarioCreateRequest,
): Promise<ScenarioCreateResponse> {
  const res = await apiFetch(`/scenario`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function processScenario(
  payload: ScenarioProcessRequest,
): Promise<ScenarioProcessResponse> {
  const res = await apiFetch(`/scenario/process`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function enhanceVoiceLines(
  payload: VoiceLineEnhancementRequest,
): Promise<VoiceLineEnhancementResponse> {
  const res = await apiFetch(`/scenario/voice-lines/enhance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateScenarioPreferredVoice(
  scenarioId: number | string,
  preferred_voice_id: string,
): Promise<Scenario> {
  const res = await apiFetch(`/scenario/${scenarioId}/preferred-voice`, {
    method: "PATCH",
    body: JSON.stringify({ preferred_voice_id }),
  });
  return res.json();
}

export async function deleteScenario(id: string | number): Promise<{ success: boolean }> {
  const res = await apiFetch(`/scenario/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function fetchPublicScenarios(): Promise<Scenario[]> {
  const res = await apiFetch(`/scenario/public-scenarios`,{
      method: "GET",
    });
  console.log(res);
  return res.json();
}