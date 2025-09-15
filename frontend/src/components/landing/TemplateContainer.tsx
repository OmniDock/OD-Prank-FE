import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PhoneIcon, 
} from "@heroicons/react/24/solid";
import { fetchPublicScenarios } from "@/lib/api.scenarios";
import type { Scenario } from "@/types/scenario";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { fetchVoices } from "@/lib/api.tts";
import { labelLanguage } from "@/lib/i18n";
import type { VoiceItem } from "@/types/tts";




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

// Temporary random image per scenario (stable per ID)
function getScenarioImage(seed: number | string, width = 1200, height = 700) {
  return `https://picsum.photos/seed/od-template-${encodeURIComponent(String(seed))}/${width}/${height}`;
}

function resolveScenarioImageUrl(url?: string | null, seed?: number | string, width = 1200, height = 700) {
  const invalid = !url || typeof url !== "string" || ["null", "none", "undefined", ""].includes(url.trim().toLowerCase());
  if (invalid) return getScenarioImage(seed ?? Math.random(), width, height);
  return url;
}

export default function TemplateContainer() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [voicesMap, setVoicesMap] = useState<Record<string, VoiceItem>>({});
  const navigate = useNavigate();

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const [sc, vr] = await Promise.allSettled([
          fetchPublicScenarios(),
          fetchVoices(),
        ]);
        if (abort) return;

        if (sc.status === "fulfilled") {
          setScenarios(sc.value || []);
        } else {
          setScenarios([]);
        }

        if (vr.status === "fulfilled") {
          const map: Record<string, VoiceItem> = {};
          (vr.value.voices || []).forEach((v) => { map[v.id] = v; });
          setVoicesMap(map);
        } else {
          setVoicesMap({});
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();
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
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-default-100 glass-card">
                <div className="w-full aspect-[32/9] bg-default-100 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-5 w-2/3 bg-default-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-default-100 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-default-100 rounded animate-pulse" />
                  <div className="h-7 w-36 bg-default-100 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {scenarios.map((s) => {
              const voice = s.preferred_voice_id ? voicesMap[s.preferred_voice_id] : undefined;
              return (
                <Card
                  key={s.id}
                  className="group relative overflow-hidden shadow-lg border-default-100 h-full rounded-3xl bg-gradient-to-br from-pink-50 via-white to-sky-50 dark:from-default-50/10 dark:via-default-50/5 dark:to-default-50/10 glass-card cursor-pointer"
                  isPressable
                  onPress={() => navigate(`/templates/${s.id}`)}
                >
                  {/* Hero image */}
                  <div className="relative">
                    <div className="aspect-[16/9] overflow-hidden bg-default-100">
                      <img
                        src={resolveScenarioImageUrl(s.background_image_url, s.id, 380, 110)}
                        alt={s.title}
                        className="w-full h-full object-fill"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur">
                        {getLanguageFlag(s.language)} {labelLanguage(s.language as any)}
                      </div>
                      {voice && (
                        <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur">
                          {voice.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <CardBody className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-primary text-white shrink-0">
                        <PhoneIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold tracking-tight truncate">
                            {s.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm text-default-600 line-clamp-3">
                          {s.description || ""}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Chip size="sm" variant="flat" color="primary" className="rounded-full">
                            {getLanguageFlag(s.language)} {labelLanguage(s.language as any)}
                          </Chip>
                          {s.preferred_voice_id && (
                            <Chip size="sm" variant="flat" color="secondary" className="rounded-full">
                              {voice?.name ?? s.preferred_voice_id}
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
