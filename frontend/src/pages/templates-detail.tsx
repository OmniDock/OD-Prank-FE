import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DefaultLayout from "@/layouts/default";
import { fetchPublicScenario } from "@/lib/api.scenarios";
import type { Scenario, VoiceLine } from "@/types/scenario";
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

export default function TemplateDetailPage() {
  const { id } = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    if (!id) return;
    fetchPublicScenario(id).then((data) => {
      if (!abort) setScenario(data);
    }).finally(() => {
      if (!abort) setLoading(false);
    });
    return () => { abort = true };
  }, [id]);

  return (
    <DefaultLayout>
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {loading && (
            <div className="text-center text-default-500">Lade Template...</div>
          )}
          {!loading && scenario && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Dummy image */}
                <div className="md:col-span-1">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-default-200/60 bg-gradient-to-br from-default-100 via-white to-default-100 dark:from-default-50/10 dark:via-default-50/5 dark:to-default-50/10">
                    <img
                      src="https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop"
                      alt={scenario.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{scenario.title}</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <Chip size="sm" variant="flat" color="primary" className="rounded-full">
                      {getLanguageFlag(scenario.language)} {scenario.language.charAt(0) + scenario.language.slice(1).toLowerCase()}
                    </Chip>
                    {scenario.preferred_voice_id && (
                      <Chip size="sm" variant="flat" color="secondary" className="rounded-full">
                        Voice: {scenario.preferred_voice_id}
                      </Chip>
                    )}
                  </div>
                  {scenario.description && (
                    <p className="text-default-600 leading-relaxed">{scenario.description}</p>
                  )}
                </div>
              </div>

              {/* Voice lines with playable audio */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Voice Lines</h2>
                <div className="space-y-4">
                  {scenario.voice_lines.map((vl: VoiceLine) => (
                    <Card key={vl.id} className="border-default-200/60">
                      <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm text-default-400">#{vl.order_index + 1} • {vl.type}</div>
                          <div className="font-medium">{vl.text}</div>
                        </div>
                        <div className="min-w-[260px]">
                          {vl.preferred_audio?.signed_url ? (
                            <audio controls src={vl.preferred_audio.signed_url} className="w-full" />
                          ) : (
                            <div className="text-default-500 text-sm">Audio nicht verfügbar</div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}


