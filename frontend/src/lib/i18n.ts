export type LanguageKey = "GERMAN" | "ENGLISH" | "ALL";
export type GenderKey = "MALE" | "FEMALE" | "ALL";
export type VoiceLineTypeKey = "OPENING" | "QUESTION" | "RESPONSE" | "CLOSING" | "FILLER";

const de = {
  language: {
    GERMAN: "Deutsch",
    ENGLISH: "Englisch",
    ALL: "Alle",
  } as Record<LanguageKey, string>,
  gender: {
    MALE: "Männlich",
    FEMALE: "Weiblich",
    ALL: "Alle",
  } as Record<GenderKey, string>,
  voiceLineType: {
    OPENING: "Eröffnung",
    QUESTION: "Frage",
    RESPONSE: "Antwort",
    CLOSING: "Abschluss",
    FILLER: "Überleitung",
  } as Record<VoiceLineTypeKey, string>,
  ui: {
    all: "Alle",
    preview: "Vorschau",
    select: "Auswählen",
    selected: "Ausgewählt",
    searchPlaceholder: "Suche nach Name, ID, Beschreibung, Sprache…",
    noVoices: "Keine Stimmen passen zu deinen Filtern.",
    chooseVoiceTitle: "Stimme auswählen",
    clickOnVoice: "Klicke auf eine Stimme aus der Liste",
    close: "Schließen",
    germanPhoneNumber: "Deutsche Telefonnummer",
  } as const,
};

function normalize(input: string): string {
  return (input || "").trim().toUpperCase();
}

function normalizeLanguage(input: string): LanguageKey | undefined {
  const v = normalize(input);
  if (v === "GERMAN" || v === "DE" || v === "DE-DE" || v === "DEU" || v === "DEUTSCH") return "GERMAN";
  if (v === "ENGLISH" || v === "EN" || v === "EN-GB" || v === "EN-US" || v === "ENG") return "ENGLISH";
  if (v === "ALL") return "ALL";
  return undefined;
}

function normalizeGender(input: string): GenderKey | undefined {
  const v = normalize(input);
  if (v === "MALE" || v === "M" || v === "MAN" || v === "MEN" || v === "MÄNNLICH") return "MALE";
  if (v === "FEMALE" || v === "F" || v === "WOMAN" || v === "WOMEN" || v === "FRAU" || v === "WEIBLICH") return "FEMALE";
  if (v === "ALL") return "ALL";
  return undefined;
}

function normalizeVoiceLineType(input: string): VoiceLineTypeKey | undefined {
  const v = normalize(input);
  if (v === "OPENING" || v === "INTRO" || v === "INTRODUCTION" || v === "START") return "OPENING";
  if (v === "QUESTION" || v === "Q" || v === "ASK") return "QUESTION";
  if (v === "RESPONSE" || v === "ANSWER" || v === "A" || v === "REPLY") return "RESPONSE";
  if (v === "CLOSING" || v === "OUTRO" || v === "END" || v === "FINISH") return "CLOSING";
  if (v === "FILLER" || v === "BRIDGE" || v === "TRANSITION") return "FILLER";
  return undefined;
}

export function labelLanguage(key: LanguageKey): string {
  return de.language[key] ?? String(key);
}

export function labelGender(key: GenderKey): string {
  return de.gender[key] ?? String(key);
}

// Accepts raw strings like "german", "english", "women", "male" and maps to German labels
export function labelLanguageAny(value: string): string {
  const k = normalizeLanguage(value);
  if (k) return labelLanguage(k);
  // Fallback: Capitalize
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function labelGenderAny(value: string): string {
  const k = normalizeGender(value);
  if (k) return labelGender(k);
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function labelVoiceLineType(key: VoiceLineTypeKey): string {
  return de.voiceLineType[key] ?? String(key);
}

export function labelVoiceLineTypeAny(value: string): string {
  const k = normalizeVoiceLineType(value);
  if (k) return labelVoiceLineType(k);
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function tr<K extends keyof typeof de.ui>(key: K): (typeof de.ui)[K] {
  return de.ui[key];
}