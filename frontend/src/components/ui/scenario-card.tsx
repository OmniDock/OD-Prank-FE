import { Card, CardBody, Chip } from "@heroui/react";
import { labelLanguage } from "@/lib/i18n";
import type { Scenario } from "@/types/scenario";
import { SparklesIcon } from "@heroicons/react/24/outline";

type ScenarioCardProps = {
  scenario: Scenario;
  onView: () => void;
  onDelete: () => void;
};

export function ScenarioCard({ scenario, onView }: ScenarioCardProps) {
  const voiceLineCount = scenario.voice_lines?.length ?? 0;

  return (
    <Card className="shadow-md hover:shadow-xl transition hover:scale-105 duration-300 glass-card bg-gradient-surface cursor-pointer" >
      <CardBody className="p-4 gap-3" onClick={onView}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl grid place-items-center shadow-inner bg-gradient-primary">
              <SparklesIcon className="w-5 h-5 text-white font-semibold" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-default-500">Szenario</div>
              <div className="text-base font-semibold text-foreground line-clamp-2">
                {scenario.title}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {scenario.target_name && (
            <Chip size="sm" variant="flat" color="default">{scenario.target_name}</Chip>
          )}
          {scenario.target_name && (
            <span className="text-default-500">•</span>
          )}
          {scenario.language && (
            <span className="uppercase text-default-600">{labelLanguage(scenario.language as any)}</span>
          )}
          {scenario.language && (
            <span className="text-default-500">•</span>
          )}
          {voiceLineCount > 0 && (
            <span className="text-default-600">{voiceLineCount} Sprachzeilen</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-default-500">Letzte Aktualisierung: {new Date(scenario.updated_at).toLocaleString()}</div>
          <div className="flex gap-2">
            <Chip size="sm" variant="flat" color={scenario.is_safe ? "success" : "danger"}>
              {scenario.is_safe ? "Abspielbar" : "Nicht abspielbar"}
            </Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}


