import { Button, Card, CardBody, Chip } from "@heroui/react";
import type { Scenario } from "@/types/scenario";
import type { VoiceItem } from "@/types/tts";

interface VoiceSettingsProps {
  scenario: Scenario;
  voices: VoiceItem[];
  onOpenVoicePicker: () => void;
}

export function VoiceSettings({ scenario, voices, onOpenVoicePicker }: VoiceSettingsProps) {
  // Helper function to check if audio is available for a voice line
  const isAudioAvailable = (voiceLineId: number): boolean => {
    if (!scenario?.voice_lines) return false;
    const voiceLine = scenario.voice_lines.find(vl => vl.id === voiceLineId);
    return !!(voiceLine?.preferred_audio?.signed_url);
  };

  return (
    <Card className={!scenario.preferred_voice_id ? "ring-2 ring-warning bg-warning/5" : "ring-1 ring-success/20 bg-success/5"}>
      <CardBody className="gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Voice Selection</h3>
            <p className="text-sm text-default-500">Choose a voice for MP3 generation</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-default-50 border border-default-200">
          <div className="flex-1">
            <div className="text-sm font-medium text-default-700">Current Voice</div>
            <div className="text-base font-semibold text-foreground mt-1">
              {(() => {
                const vid = scenario.preferred_voice_id;
                if (!vid) return (
                  <span className="text-default-400 italic">No voice selected</span>
                );
                const v = voices.find(x => x.id === vid);
                const generatedCount = scenario.voice_lines.filter(vl => isAudioAvailable(vl.id)).length;
                const totalCount = scenario.voice_lines.length;
                
                return v ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span>{v.name}</span>
                      <Chip size="sm" variant="flat" color="primary">
                        {v.gender}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-default-500">Samples:</span>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color={generatedCount === totalCount ? "success" : generatedCount > 0 ? "warning" : "default"}
                      >
                        {generatedCount}/{totalCount}
                      </Chip>
                    </div>
                  </div>
                ) : (
                  <span className="text-default-600">{vid}</span>
                );
              })()}
            </div>
          </div>
          <Button 
            size="sm"
            color="primary" 
            variant={scenario.preferred_voice_id ? "flat" : "solid"}
            onPress={onOpenVoicePicker}
            className="shrink-0"
          >
            {scenario.preferred_voice_id ? "Change Voice" : "Select Voice"}
          </Button>
        </div>
        
        {!scenario.preferred_voice_id && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <svg className="w-4 h-4 text-warning shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-warning-700">
              A voice must be selected to enable MP3 generation for voice lines.
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
