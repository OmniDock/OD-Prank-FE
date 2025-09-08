import { useEffect, useState } from "react";
import { addToast } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { fetchScenarios, deleteScenario } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import ScenarioCreateModal from "@/components/scenario-create-modal";
import DeleteConfirmationModal from "@/components/delete-confirmation-modal";
import { motion } from "framer-motion";
import { ScenarioCard } from "@/components/ui/scenario-card";
import LoadingScreen from '@/components/LoadingScreen';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchScenarios(50, 0, false);
        setScenarios(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleScenarioCreated(scenario: Scenario) {
    setScenarios((prev) => [scenario, ...prev]);
  }

  function handleDeleteClick(scenario: Scenario) {
    setScenarioToDelete(scenario);
    setIsDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!scenarioToDelete) return;
    
    await deleteScenario(scenarioToDelete.id);
    setScenarios((prev) => prev.filter((s) => s.id !== scenarioToDelete.id));
    addToast({
      title: "Scenario deleted",
      description: `Successfully deleted "${scenarioToDelete.title}"`,
      color: "success",
      timeout: 3000,
    });
    setScenarioToDelete(null);
  }

  return (
    <section className="space-y-4 h-full">

      {loading ? (
        <LoadingScreen message="Szenarien werden geladen..." />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div>
            {scenarios.length === 0 ? (
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
                  <div className="text-default-500 text-4xl font-semibold text-gradient">No Scenario yet</div>
                  <div className="text-default-500 text-2xl ">Create a new scenario to get started</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {scenarios.map((s) => (
                    <ScenarioCard
                      key={s.id}
                      scenario={s}
                      onView={() => navigate(`/dashboard/scenarios/${s.id}`)}
                      onDelete={() => handleDeleteClick(s)}
                    />
                  ))}
                </div>
              )}
          </div>
        </motion.div>
      )}

      <ScenarioCreateModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleScenarioCreated}
      />

      {scenarioToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Delete Scenario"
          itemName={scenarioToDelete.title}
          description={`You are about to permanently delete the scenario "${scenarioToDelete.title}" and all its associated data including voice lines and audio files.`}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </section>
  );
}