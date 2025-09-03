import DefaultLayout from "@/layouts/default";
import Hero from "@/components/landing/Hero";
import ChatWindow from "@/components/landing/ChatWindow";
import Stats from "@/components/landing/Stats";
import TemplateContainer from "@/components/landing/TemplateContainer";
import VoiceShowcase from "@/components/landing/VoiceShowcase";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <AnimatedBackground variant="mixed" density={15} />

      <section id="hero" className="relative min-h-screen flex flex-col justify-center items-center gap-20">
        <Hero />
        <ChatWindow />
        <Stats />
      </section>

      <section id="templates" className="py-20 md:py-28">
        <TemplateContainer />
      </section>

      {/* Voice Showcase Section */}
      <section id="voices" className="py-20 md:py-28 bg-transparent dark:bg-default-950/30">
        <div className="container mx-auto px-6 max-w-7xl">
          <VoiceShowcase 
            title="Meet Some of Our Voices"
            subtitle="Professional voices from around the world, ready to bring your pranks to life"
            maxVoices={6}
          />
        </div>
      </section>
    </DefaultLayout>
  );
}
