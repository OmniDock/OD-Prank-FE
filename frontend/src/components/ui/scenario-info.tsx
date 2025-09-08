import { useState } from "react";
import { Card, CardBody, addToast, Button } from "@heroui/react";
import type { Scenario } from "@/types/scenario";
import DeleteConfirmationModal from "@/components/delete-confirmation-modal";
import SetActiveModal from "@/components/set-active-modal";
import { deleteScenario } from "@/lib/api.scenarios";
import { TrashIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

interface ScenarioInfoProps {
  scenario: Scenario;
  onRefresh?: () => Promise<void>;
}

export function ScenarioInfo({ scenario, onRefresh }: ScenarioInfoProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  async function handleDeleteConfirm() {
    if (!scenario) return;
    
    const res = await deleteScenario(scenario.id);
    if (res.success) {
    addToast({
      title: "Scenario deleted",
      description: `Successfully deleted "${scenario.title}"`,
      color: "success",
      timeout: 3000,
    });
    navigate("/dashboard/scenarios");
    }
  }

  return (
    <Card className="ring-1 ring-default-200  glass-card bg-gradient-surface">
      <CardBody className="gap-6" >
        <div className="flex flex-row justify-between cursor-pointer items-center" onClick={() => setExpanded((v) => !v)}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <span className="text-primary" aria-hidden>📋</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Scenario Details</h2>
              <p className="text-sm text-default-500">Overview and configuration</p>
            </div>
          </div>
          <div className="flex flex-row gap-2 items-center">
            {/* <Button 
              color={scenario.is_active ? "warning" : "success"} 
              variant="flat"
              size="sm"
              startContent={<PowerIcon className="w-4 h-4" />}
              onPress={() => setIsActiveModalOpen(true)}
            >
              {scenario.is_active ? "Deactivate" : "Set Active"}
            </Button> */}

            <Button
              isIconOnly
              variant="light"
              aria-label={expanded ? "Collapse" : "Expand"}
              onPress={() => setExpanded((v) => !v)}
            >
              <ChevronDownIcon className={`w-5 h-5 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`} />
            </Button>
          </div>
        </div>

        {expanded && (
        <div className="space-y-4">
          {/* Target and Language Row (on top) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary" aria-hidden>🎯</span>
                <span className="text-xs font-medium text-primary">Target Name</span>
              </div>
              <div className="text-base font-semibold text-foreground">{scenario.target_name}</div>
            </div>
            
            <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-secondary/5 to-secondary/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-secondary" aria-hidden>🗣️</span>
                <span className="text-xs font-medium text-secondary">Language</span>
              </div>
              <div className="text-base font-semibold text-foreground">{scenario.language}</div>
            </div>


            
            <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-secondary/5 to-secondary/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary" aria-hidden>🎭</span>
                <span className="text-xs font-medium text-secondary">Calling Persona</span>
              </div>
              <div className="text-base font-semibold text-foreground">{scenario.scenario_analysis?.analysis?.persona_name}</div>
            </div>
            
            <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-secondary/5 to-secondary/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-secondary" aria-hidden>🚻</span>
                <span className="text-xs font-medium text-secondary">Calling Gender</span>
              </div>
              <div className="text-base font-semibold text-foreground">{scenario.scenario_analysis?.analysis?.persona_gender}</div>
            </div>
          </div>

          {/* Description (below) */}
          {scenario.description && (
            <div className="p-5 rounded-xl border border-default-200 bg-gradient-to-br from-default-50 to-default-100/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-default-600" aria-hidden>📝</span>
                <span className="text-sm font-semibold text-default-700">Description</span>
              </div>
              <p className="text-default-900 whitespace-pre-wrap leading-relaxed">{scenario.description}</p>
            </div>
          )}
          <div className="flex justify-end">
            <Button 
                color="danger" 
                variant="flat"
                size="sm"
                startContent={<TrashIcon className="w-4 h-4" />}
                onPress={() => setIsDeleteOpen(true)}
              >
              Delete
            </Button> 
          </div>
        </div>
        )}



        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Delete Scenario"
          itemName={scenario.title}
          description={`You are about to permanently delete the scenario "${scenario.title}" and all its associated data including voice lines and audio files.`}
          onConfirm={handleDeleteConfirm}
        />

        <SetActiveModal
          isOpen={isActiveModalOpen}
          onOpenChange={setIsActiveModalOpen}
          scenario={scenario}
          onScenarioUpdate={async () => {
            if (onRefresh) {
              await onRefresh();
            } else {
              window.location.reload();
            }
          }}
        />

      </CardBody>
    </Card>
  );
}
