import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
  addToast,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { fetchScenarios, deleteScenario } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import ScenarioCreateModal from "@/components/scenario-create-modal";
import DeleteConfirmationModal from "@/components/delete-confirmation-modal";
import { motion } from "framer-motion";
import { ArrowsPointingOutIcon, TrashIcon } from "@heroicons/react/24/outline";

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
    <section className="space-y-4">
      <div className="flex items-center justify-end">

        <Button color="primary" size="sm" onPress={() => setIsCreateOpen(true)}>
          New Scenario
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Card>
            <CardBody>
              <Table aria-label="Scenarios table" removeWrapper>
                <TableHeader>
                  <TableColumn>Title</TableColumn>
                  <TableColumn>Target</TableColumn>
                  <TableColumn>Language</TableColumn>
                  <TableColumn>Safe</TableColumn>
                  <TableColumn>Active</TableColumn>
                  <TableColumn>Created</TableColumn>
                  <TableColumn> </TableColumn>
                </TableHeader>
                <TableBody emptyContent="No scenarios yet">
                  {scenarios.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.title}</TableCell>
                      <TableCell>{s.target_name}</TableCell>
                      <TableCell className="uppercase">{s.language}</TableCell>
                      <TableCell>
                        <Chip color={s.is_safe ? "success" : "danger"} variant="flat">
                          {s.is_safe ? "Safe" : "Unsafe"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip color={s.is_active ? "success" : "danger"} variant="flat">
                          {s.is_active ? "Active" : "Inactive"}
                        </Chip>
                      </TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="flat" 
                          onPress={() => navigate(`/dashboard/scenarios/${s.id}`)} 
                          isIconOnly 
                          startContent={<ArrowsPointingOutIcon className="w-4 h-4" />} 
                        />
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="danger"
                          onPress={() => handleDeleteClick(s)} 
                          isIconOnly 
                          startContent={<TrashIcon className="w-4 h-4" />} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
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