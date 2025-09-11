import { useEffect, useState } from "react";
import { fetchPublicScenarios } from "@/lib/api.scenarios";
import PubScenarioCard from "./PubScenarioCard";
import type { Scenario } from "@/types/scenario";

export default function PubScenarioContainer() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    let abort = false;
    fetchPublicScenarios()
      .then((data) => { if (!abort) setScenarios(data || []); })
      .catch(() => { if (!abort) setScenarios([]); });
    return () => { abort = true; };
  }, []);

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Beliebte Szenarien</span>
          </h2>
          <p className="text-lg text-default-600 max-w-2xl mx-auto">
            Wähle aus unserer Sammlung an lustigen Prank-Szenarien oder erstelle dein eigenes Setup
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {scenarios.map((scenario) => (
            <PubScenarioCard
              key={scenario.id}
              title={scenario.title}
              description={scenario.description ?? ""}
              tags={scenario.tags ?? []}
              language={scenario.language}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-full bg-gradient-primary text-white font-semibold hover:scale-105 transition-transform">
            Alle Szenarien anzeigen
          </button>
        </div>
      </div>
    </section>
  );
}
  