import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PhoneIcon, 
} from "@heroicons/react/24/solid";
import { fetchPublicScenarios } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";




function getLanguageFlag(language: string) {
  const flags: Record<string, string> = {
    GERMAN: "🇩🇪",
    ENGLISH: "🇬🇧",
    SPANISH: "🇪🇸",
    FRENCH: "🇫🇷",
    ITALIAN: "🇮🇹",
  };
  return flags[language] || "🌍";
}

export default function TemplateContainer() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let abort = false;
    fetchPublicScenarios().then((data) => {
      if (!abort) setScenarios(data || []);
    }).catch(() => {
      if (!abort) setScenarios([]);
    });
    return () => { abort = true };
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
          {scenarios.map((s) => (
            <Card
              key={s.id}
              className="group relative overflow-visible shadow-lg hover:scale-105 transition-transform duration-300 transform-gpu border-default-100 h-full rounded-3xl bg-gradient-to-br from-pink-50 via-white to-sky-50 dark:from-default-50/10 dark:via-default-50/5 dark:to-default-50/10 glass-card cursor-pointer"
            >
              <CardBody className="p-6" onClick={() => navigate(`/templates/${s.id}`)}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-primary text-white">
                    <PhoneIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold tracking-tight truncate">{s.title}</h3>
                      <Chip size="sm" variant="flat" color="primary" className="rounded-full">
                        {getLanguageFlag(s.language)} {s.language.charAt(0) + s.language.slice(1).toLowerCase()}
                      </Chip>
                    </div>
                    <p className="mt-2 text-sm text-default-600 line-clamp-3">{s.description || ""}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
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
