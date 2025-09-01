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
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { fetchScenarios } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import ScenarioCreateModal from "@/components/scenario-create-modal";
import { motion } from "framer-motion";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchScenarios();
        setScenarios(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleScenarioCreated(scenario: Scenario) {
    setScenarios((prev) => [scenario, ...prev]);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Scenarios</h1>
        <Button color="primary" onPress={() => setIsCreateOpen(true)}>
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
                  <TableColumn>Created</TableColumn>
                  <TableColumn>Actions</TableColumn>
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
                      <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="flat" onPress={() => navigate(`/dashboard/scenarios/${s.id}`)}>
                          Details
                        </Button>
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
    </section>
  );
}
