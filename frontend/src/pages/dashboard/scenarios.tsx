import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  Chip,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { createScenario, fetchScenarios } from "@/lib/api.scenarios";
import type { Scenario, ScenarioCreateRequest } from "@/types/scenario";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ScenarioCreateRequest>({
    title: "Pizza Delivery Prank",
    target_name: "John Doe",
    language: "GERMAN",
    description: "A funny prank call pretending to be a pizza delivery service",
  });
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

  const canSubmit = form.title.trim().length > 0 && form.target_name.trim().length > 0 && !creating;

  async function onCreate() {
    if (!canSubmit) return;
    setCreating(true);
    try {
      const res = await createScenario(form);
      setScenarios((prev) => [res.scenario, ...prev]);
      setIsCreateOpen(false);
      // Keep dummy defaults for rapid debugging / repeated creates
      setForm({
        title: "Pizza Delivery Prank",
        target_name: "John Doe",
        language: "GERMAN",
        description: "A funny prank call pretending to be a pizza delivery service",
      });
      navigate(`/dashboard/scenarios/${res.scenario.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Scenarios</h1>
        <Button color="primary" onPress={() => setIsCreateOpen(true)}>
          New Scenario
        </Button>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <Table aria-label="Scenarios table">
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
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} size="2xl">
        <ModalContent>
          <ModalHeader>New Scenario</ModalHeader>
          <ModalBody className="space-y-3">
            <Input
              label="Title"
              isRequired
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              label="Target Name"
              isRequired
              value={form.target_name}
              onChange={(e) => setForm({ ...form, target_name: e.target.value })}
            />
            <Select
              label="Language"
              selectedKeys={new Set([form.language ?? "GERMAN"])}
              onSelectionChange={(keys) => {
                const [key] = Array.from(keys as Set<string>);
                setForm({ ...form, language: (key as any) });
              }}
            >
              <SelectItem key="GERMAN">German</SelectItem>
              <SelectItem key="ENGLISH">English</SelectItem>
            </Select>
            <Textarea
              label="Description"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={onCreate} isDisabled={!canSubmit} isLoading={creating}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
