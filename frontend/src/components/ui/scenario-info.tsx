import { useState } from "react";
import { Card, CardBody, addToast, Button } from "@heroui/react";
import type { Scenario } from "@/types/scenario";
import DeleteConfirmationModal from "@/components/delete-confirmation-modal";
import SetActiveModal from "@/components/set-active-modal";
import { deleteScenario } from "@/lib/api.scenarios";
import { TrashIcon, PowerIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
interface ScenarioInfoProps {
  scenario: Scenario;
  onRefresh?: () => Promise<void>;
}

export function ScenarioInfo({ scenario, onRefresh }: ScenarioInfoProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
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
    <Card className="ring-1 ring-default-200 cursor-pointer glass-card bg-gradient-surface">
      <CardBody className="gap-6" onClick={() => setExpanded((v) => !v)}>
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Scenario Details</h2>
              <p className="text-sm text-default-500">Overview and configuration</p>
            </div>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <Button 
              color={scenario.is_active ? "warning" : "success"} 
              variant="flat"
              size="sm"
              startContent={<PowerIcon className="w-4 h-4" />}
              onPress={() => setIsActiveModalOpen(true)}
            >
              {scenario.is_active ? "Deactivate" : "Set Active"}
            </Button>
            <Button 
              color="danger" 
              variant="flat"
              size="sm"
              startContent={<TrashIcon className="w-4 h-4" />}
              onPress={() => setIsDeleteOpen(true)}
            >
              Delete
            </Button>
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
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-medium text-primary">Target Name</span>
              </div>
              <div className="text-base font-semibold text-foreground">{scenario.target_name}</div>
            </div>
            
            <div className="p-4 rounded-xl border border-default-200 bg-gradient-to-br from-secondary/5 to-secondary/10">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="text-xs font-medium text-secondary">Language</span>
              </div>
              <div className="text-base font-semibold text-foreground">{scenario.language}</div>
            </div>
          </div>

          {/* Description (below) */}
          {scenario.description && (
            <div className="p-5 rounded-xl border border-default-200 bg-gradient-to-br from-default-50 to-default-100/50">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-default-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span className="text-sm font-semibold text-default-700">Description</span>
              </div>
              <p className="text-default-900 whitespace-pre-wrap leading-relaxed">{scenario.description}</p>
            </div>
          )}
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
