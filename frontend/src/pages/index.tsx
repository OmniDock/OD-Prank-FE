import DefaultLayout from "@/layouts/default";
import Hero from "@/components/landing/Hero";
import ChatWindow from "@/components/landing/ChatWindow";
import { SpeakerWaveIcon, PhoneIcon } from "@heroicons/react/24/solid";
import Stats from "@/components/landing/Stats";

export default function IndexPage() {
  return (
    <DefaultLayout>
      {/* Combined animated gradient background + floating phone icons */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 opacity-20" />
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating phone icons */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-[0.05] dark:opacity-[0.09] animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          >
            <PhoneIcon className="w-14 h-14 text-purple-600 dark:text-purple-400" />
          </div>
        ))}
        
        {/* Additional message/chat bubble icons for variety */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`msg-${i}`}
            className="absolute opacity-[0.05] dark:opacity-[0.09] animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10 + 5}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}
          >
            <SpeakerWaveIcon className="w-14 h-14 text-purple-600 dark:text-purple-400" />
          </div>
        ))}
      </div>

      <section className="relative min-h-screen flex flex-col justify-center items-center gap-20">
        <Hero />
        <ChatWindow />
        <Stats />
      </section>

      <section className="py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Feature
            title="Scenario Builder"
            desc="Design elaborate prank setups with branching flows."
          />
          <Feature
            title="Realistic Voices"
            desc="Choose from a growing catalog of ultra-realistic voices."
          />
          <Feature
            title="One-click Calls"
            desc="Launch a call and monitor it from your dashboard."
          />
        </div>
      </section>
    </DefaultLayout>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <div className="font-semibold mb-2">{title}</div>
      <div className="text-sm text-neutral-600 dark:text-neutral-300">{desc}</div>
    </div>
  );
}
