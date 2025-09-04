import { Card, CardBody, Chip, Button } from "@heroui/react";
import type { Scenario } from "@/types/scenario";
import { ArrowsPointingOutIcon, TrashIcon } from "@heroicons/react/24/outline";

type ScenarioCardProps = {
  scenario: Scenario;
  onView: () => void;
  onDelete: () => void;
};

export function ScenarioCard({ scenario, onView, onDelete }: ScenarioCardProps) {
  const voiceLineCount = scenario.voice_lines?.length ?? 0;

  return (
    <Card className="shadow-md hover:shadow-xl transition hover:scale-105 duration-300 glass-card bg-gradient-surface">
      <CardBody className="p-4 gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-default-500">Scenario</div>
            <div className="text-base font-semibold text-foreground line-clamp-2">
              {scenario.title}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <Chip size="sm" variant="flat" color={scenario.is_safe ? "success" : "danger"}>
              {scenario.is_safe ? "Safe" : "Unsafe"}
            </Chip>
            <Chip size="sm" variant="flat" color={scenario.is_active ? "success" : "default"}>
              {scenario.is_active ? "Active" : "Inactive"}
            </Chip> */}
            <Button 
              size="sm" 
              variant="flat" 
              onPress={onView} 
              isIconOnly 
              startContent={<ArrowsPointingOutIcon className="w-4 h-4" />} 
            />
            <Button 
              size="sm" 
              variant="flat" 
              color="danger"
              onPress={onDelete} 
              isIconOnly 
              startContent={<TrashIcon className="w-4 h-4" />} 
            />
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
          <span className="uppercase text-default-600">{scenario.language}</span>
          )}
          {scenario.language && (
          <span className="text-default-500">•</span>
          )}
          {voiceLineCount > 0 && (
          <span className="text-default-600">{voiceLineCount} lines</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-default-500">Updated {new Date(scenario.updated_at).toLocaleString()}</div>
          <div className="flex gap-2">

          </div>
        </div>
      </CardBody>
    </Card>
  );
}


