import DefaultLayout from "@/layouts/default";
import Hero from "@/components/landing/Hero";
import ChatWindow from "@/components/landing/ChatWindow";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="relative min-h-screen flex flex-col justify-center items-center gap-20">
        <Hero />
        <ChatWindow />
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
