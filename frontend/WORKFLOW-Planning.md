## README: UX-Flow für Szenario- und Sprachsynthese (mit ElevenLabs)

### Zielsetzung
Dieses Dokument beschreibt einen optimalen, robusten UX-/System-Flow, um Prank-Call-Szenarien zu erstellen, Texte zu generieren, Stimmen auszuwählen und Voice Lines als MP3 zu erzeugen. Es adressiert Wiederholbarkeit, Nachbearbeitung, Persistenz aller relevanten Informationen (inkl. Szenario-Analyse) sowie Missbrauchsvermeidung (Limitierung von Neugenerierungen für Text und Audio).

### Leitprinzipien
- **2‑Schritt-Ansatz (empfohlen)**:
  1) Skript- und Szenario-Erstellung inkl. Analyse und Text-Freigabe.
  2) Stimmwahl und TTS-Generierung der Voice Lines (MP3), mit Vorschau/Regeneration innerhalb fairer Limits.
- **Persistenz & Nachvollziehbarkeit**: Alle relevanten Zwischenergebnisse (Szenario-Analyse, generierte Voice Lines, gewählte Stimme/Geschlecht, TTS-Modelle, Zählerstände) werden in der DB gespeichert.
- **Missbrauchsschutz**: Pro Benutzer/Szenario/Voice Line klar definierte Limits, Cooldowns, Caching/Re-Use identischer Ergebnisse, Logging.
- **Kuratiertes Voice-Angebot**: Stimmen aus ElevenLabs werden kuratiert/erweiterbar verwaltet (mit Gender/Language/Preview), optional dynamisch synchronisiert.

---

## End-to-End UX-Flow

### Schritt 1: Szenario erstellen (Text)
1. Nutzer füllt Formular aus: `title`, `description`, `language`, `target_name` (+ optionale Felder).
2. Sofortige Validierung (Pflichtfelder, Länge, Sprache).
3. Absenden erzeugt ein neues `Scenario` (Status: Draft) und triggert asynchron den Initial-Workflow:
   - Safety-Check (bereits vorhanden): `is_safe`, `is_not_safe_reason`.
   - Szenario-Analyse: Persona, Sprachmuster, Tonalität, kultureller Kontext, Ziele etc. (siehe Structure unten). Ergebnis als JSON persistieren.
   - Generierung initialer Voice-Line-Texte in Kategorien: OPENING, QUESTION, RESPONSE, CLOSING (mehrere Varianten nach Zielanzahl), sortiert per `order_index`.

UI: Nach Absenden landet der Nutzer in einem „Skript-Editor“:
- Gruppierte Tabs/Sektionen nach VoiceLine-Typen mit Listenansicht.
- Aktionen je Zeile: „Bearbeiten“, „Duplizieren“, „Löschen“, „Nach oben/unten“, „Regenerieren (Text)“.
- Anzeigen: Safety-Hinweise, Qualitätshinweise aus der Analyse.
- Limit-/Zähleranzeigen für Text-Regenerierungen.
- CTA: „Skript freigeben & weiter zu Stimmen“.

### Schritt 2: Stimmen wählen & TTS generieren (Audio)
1. Nutzer wählt zunächst global für das Szenario:
   - `gender` (männlich/weiblich)
   - `voice` (konkrete ElevenLabs Voice ID aus kuratierter Liste je Sprache/Gender)
   - optional: `model` (z. B. `eleven_turbo_v2`, `eleven_tts_v3`, gemäß Enums)
2. Optional: Pro Voice Line kann die globale Stimme überschrieben werden (Fortgeschritteneinstellung).
3. Vorschau pro Stimme (kurzer Preview-Clip). Stimmenliste per Backend-Endpoint ausgeliefert.
4. „Audio generieren“ (für alle oder selektierte Voice Lines):
   - Fortschrittsanzeige pro Zeile.
   - Bei Erfolg: MP3 gespeichert, signierte URL generiert und in UI abspielbar.
   - Bei Fehlschlag: Fehlerhinweis pro Zeile, Retry-Button (beachtet Limits).

UI-Details:
- Spalten: Text, Stimme, Dauer, Status, Aktionen (Abspielen, Neu generieren, Stimme ändern).
- Zähler/Limit-Hinweis für Audio-Regenerationen pro Zeile und pro Szenario.
- CTA: „Fertigstellen & speichern“ → Szenario Status: „Ready“.

### Wiederkehrende Bearbeitung
- Nutzer kann jederzeit zu Schritt 1 zurück, Text anpassen und betroffene Voice Lines gezielt neu erzeugen (Resets beachten).
- Änderungen an Stimme/Gender triggert optional Massen-Neuerzeugung (mit explizitem Hinweis auf Kosten/Limits).

---

## Backend-Schnittstellen (high-level)

Bereits vorhanden (Auszug):
- `GET /api/v1/tts/voices` → Liste kuratierter Stimmen (nach `language`/`gender`).
- `POST /api/v1/tts/generate/single|batch|scenario` → Audio für eine/mehrere Voice Lines erzeugen & speichern.
- `POST /api/v1/tts/regenerate` → Audio neu generieren und altes Asset löschen.

Erweiterungen (Vorschlag):
- `POST /api/v1/scenarios/{id}/analyze` → Szenario-Analyse persistent speichern (JSONB), falls nicht bereits im Initial-Flow persistiert.
- `GET /api/v1/scenarios/{id}` → Enthält `analysis_json`, Zählerstände, globale Voice-Settings.
- `PATCH /api/v1/voice-lines/{id}` → Text-/Meta-Updates je Zeile; Rückgabe aktualisierter Daten.
- `GET /api/v1/voice-lines?scenario_id=...` → Liste inkl. TTS-Status, Dauer, Zähler.
- `GET /api/v1/tts/voices/sync` (admin) → ElevenLabs → Voice-Katalog aktualisieren.

---

## Datenmodell-Erweiterungen

### Scenario (ergänzen)
- `analysis_json JSONB` (Struktur gemäß ScenarioAnalysisResult):
  - `persona_name`, `persona_background`, `company_service`, `speech_patterns[]`,
    `emotional_state`, `conversation_goals[]`, `believability_anchors[]`,
    `absurdity_escalation[]`, `cultural_context`, `quality_score`.
- `preferred_gender` (Enum)
- `preferred_voice_id` (String)
- `tts_model` (Enum)
- `text_regen_count` (Integer, default 0)
- `voice_regen_count` (Integer, default 0)
- `text_regen_limit` (Integer, z. B. 5 pro Szenario)
- `voice_regen_limit` (Integer, z. B. 5 pro Szenario)

### VoiceLine (ergänzen)
- `elevenlabs_voice_id` (String, nullable; setzt globale Auswahl außer Kraft)
- `gender` (Enum, nullable)
- `model_id` (Enum/String)
- `audio_duration_ms` (Integer)
- `generation_count` (Integer, default 0)
- `last_generated_at` (Timestamp)
- `text_hash` (String; zur Cache-Erkennung bei identischen Inhalten)

### VoiceCatalog (neu)
- `voice_id` (PK), `name`, `language`, `gender`, `description`, `preview_url`, `enabled`, `labels JSONB`.
- Dient zur kuratierten Anzeige und Filterung im Frontend; Synchronisation mit ElevenLabs optional.

### GenerationLog (neu)
- `id`, `user_id`, `scenario_id`, `voice_line_id`, `type` (text|audio), `action` (generate|regenerate), `success`, `error`, `cost_ms`, `created_at`.
- Grundlage für Monitoring, Missbrauchserkennung und Support.

---

## Missbrauchsverhinderung & Kostenkontrolle

- **Harte Limits**: pro Szenario `text_regen_limit` und `voice_regen_limit` (UI zeigt Zähler). Pro Voice Line optional eigenes Limit (z. B. 3).
- **Cooldowns**: z. B. 30–60s zwischen Serien-Regenerierungen pro Zeile.
- **Caching/Re-Use**: Wenn (`text_hash`, `voice_id`, `model_id`) identisch, vorhandenes Audio wiederverwenden statt neu zu generieren.
- **Dupes verhindern**: Gleiche Anfrage unmittelbar blocken oder per Debounce.
- **Rate Limiting**: IP- und User-basiert (API-Gateway/Reverse Proxy/Backend-Middleware).
- **Logging & Alerts**: `GenerationLog` auswerten, Schwellenwerte → Benachrichtigung/Soft-Block.
- **Admin Overrides**: Admin kann Limits je User/Projekt anpassen.

---

## ElevenLabs-Integration (Stimmen & TTS)

### Stimmen abrufen & pflegen
- Stimmen aus ElevenLabs via SDK/API abrufen und in `VoiceCatalog` spiegeln (inkl. Labels/Attribute). Gender ist nicht immer explizit → Mapping über Labels/Name oder manuelle Kuratierung.
- Backend-Endpoint liefert gefilterte, kuratierte Liste: nach `language`, `gender`, optional `accent`/`style`.
- Vorschau-URLs: Entweder aus ElevenLabs (falls vorhanden) oder eigener kurzer Sample-Text, der einmalig pro Stimme generiert und gespeichert wird.

### TTS erzeugen
- API-Aufruf: `text_to_speech.convert(text, voice_id, model_id, voice_settings, ...)` → MP3-Bytes.
- Ablage: MP3 in privatem Storage (Supabase) speichern, `storage_path` speichern, signierte URL für UI.
- Metadaten persistieren: verwendete `voice_id`, `model_id`, Dauer, `generation_count`++, `last_generated_at`.

---

## Frontend UX-Details (Wizard)

- Zweistufiger Wizard mit Progressbar:
  1) „Skript erstellen“: Editor mit Voice-Line-Listen (CRUD, Regenerate Text, Zähler/Limit-Hinweise).
  2) „Stimmen & Audio“: Globale Auswahl (Gender/Voice/Model), optional per Zeile Override, Preview + Generieren.
- Batch-Aktionen: „Alle generieren“, „Nur ungegenerierte generieren“, „Fehlgeschlagene erneut versuchen“.
- Statusanzeigen: pro Zeile (Pending, Generating, Ready, Failed, Regens left: n/x).
- Navigationssicherheit: Beim Verlassen Warnung, wenn ungespeicherte Änderungen vorliegen.

---

## Migrations- & Implementierungsplan (schrittweise)

1) Datenmodell erweitern (Scenario, VoiceLine, VoiceCatalog, GenerationLog) + Migrationen.
2) Szenario-Analyse persistent machen (`analysis_json`) und im `GET /scenarios/{id}` ausliefern.
3) Stimmen-Endpunkt auf kuratierten Katalog umstellen; Admin-Sync von ElevenLabs.
4) Text-Regenerationen mit Limit/Cooldown + Zählern in UI und Backend.
5) TTS-Generierung: Zähler/Limit + Caching identischer Inhalte; Dauer messen/speichern.
6) Wizard-UX mit Editor & TTS-Tab, Regenerate-Flows und Batch-Aktionen.
7) Monitoring/Logging & Admin-Overrides; Alerts bei Missbrauch.

---

## Offene Punkte / Annahmen
- Gender-Metadaten bei ElevenLabs sind nicht immer konsistent → kuratiertes Mapping im `VoiceCatalog` notwendig.
- Einfache Kostenlogik: Limits/Cooldowns ausreichend; Credits/Subscriptions optional später.
- Mehrsprachige Stimmen: Stimmenliste pro Sprache pflegen, `language` aus Scenario als Default.

---

## Datenstrukturen (Beispiel)

### Scenario.analysis_json (vereinfacht)
```json
{
  "persona_name": "Giuseppe",
  "persona_background": "Italienischer Lieferfahrer...",
  "company_service": "Express-Kurier",
  "speech_patterns": ["leicht hektisch", "freundlich"],
  "emotional_state": "aufgeregt",
  "conversation_goals": ["Rückruf erhalten", "Adresse klären"],
  "believability_anchors": ["Sendungsnummer X", "Fahrername"],
  "absurdity_escalation": ["leichte Verwechslung", "zunehmender Unsinn"],
  "cultural_context": "deutschsprachiger Raum",
  "quality_score": 0.86
}
```

---

## Ergebnis
Mit diesem 2‑Schritt-Flow erzielen wir:
- Klarheit und Kontrolle beim Text (Schritt 1) und Audio (Schritt 2).
- Persistente Nachvollziehbarkeit und Wiederverwendbarkeit.
- Wirksame Limitierung gegen Missbrauch und transparente Zähler für Nutzer.
- Saubere Integration von ElevenLabs mit kuratiertem Voice-Katalog und stabilen TTS-Flows.


