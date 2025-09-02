import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { fetchScenarios } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";

type ScenarioGridSelectProps = {
  selectedId?: number | null;
  onSelect: (scenario: Scenario) => void;
  disabled?: boolean;
};

export default function ScenarioGridSelect({ selectedId, onSelect, disabled }: ScenarioGridSelectProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchScenarios(100, 0);
        setScenarios(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load scenarios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    return [...scenarios].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [scenarios]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-default-500"><Spinner size="sm" /> Loading scenarios…</div>
    );
  }

  if (error) {
    return <div className="text-danger text-sm">{error}</div>;
  }

  if (sorted.length === 0) {
    return <div className="text-default-500 text-sm">No scenarios yet.</div>;
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {sorted.map((s) => {
        const isSelected = s.id === selectedId;
        const count = s.voice_lines?.length ?? 0;
        return (
          <button
            key={s.id}
            onClick={() => !disabled && onSelect(s)}
            disabled={disabled}
            className={[
              "text-left",
              "rounded-xl",
              "border-2",
              isSelected ? "border-primary" : "border-default-200",
              "bg-content1",
              "transition",
              "hover:shadow-lg",
              "hover:-translate-y-0.5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            ].join(" ")}
          >
            <Card shadow="none" className="bg-transparent shadow-lg">
              <CardBody className="p-4 gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm text-default-500">Scenario</div>
                    <div className="text-base font-semibold text-foreground line-clamp-2">{s.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat" color="default">
                      {s.target_name}
                    </Chip>
                    {isSelected && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-default-600">
                  <span className="uppercase">{s.language}</span>
                  <span>•</span>
                  <span>{count} lines</span>
                </div>

                <div className="text-xs text-default-500">
                  Updated {new Date(s.updated_at).toLocaleString()}
                </div>
              </CardBody>
            </Card>
          </button>
        );
      })}
    </motion.div>
  );
}


