import { useMemo } from "react";
import DefaultLayout from "@/layouts/default";
import Hero from "@/components/landing/Hero";
import ChatWindow from "@/components/landing/ChatWindow";
import { SpeakerWaveIcon, PhoneIcon } from "@heroicons/react/24/solid";
import Stats from "@/components/landing/Stats";
import TemplateContainer from "@/components/landing/TemplateContainer";
import Footer from "@/components/landing/Footer";
import VoiceShowcase from "@/components/landing/VoiceShowcase";

export default function IndexPage() {
  // Memoize floating icons positions to prevent regeneration on every render
  const floatingPhones = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 10
    })), []
  );
  
  const floatingSpeakers = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 10 + 5,
      duration: 20 + Math.random() * 10
    })), []
  );
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
        {floatingPhones.map((phone) => (
          <div
            key={`phone-${phone.id}`}
            className="absolute opacity-[0.05] dark:opacity-[0.09] animate-float"
            style={{
              left: `${phone.left}%`,
              top: `${phone.top}%`,
              animationDelay: `${phone.delay}s`,
              animationDuration: `${phone.duration}s`
            }}
          >
            <PhoneIcon className="w-14 h-14 text-purple-600 dark:text-purple-400" />
          </div>
        ))}
        
        {/* Additional message/chat bubble icons for variety */}
        {floatingSpeakers.map((speaker) => (
          <div
            key={`speaker-${speaker.id}`}
            className="absolute opacity-[0.05] dark:opacity-[0.09] animate-float"
            style={{
              left: `${speaker.left}%`,
              top: `${speaker.top}%`,
              animationDelay: `${speaker.delay}s`,
              animationDuration: `${speaker.duration}s`
            }}
          >
            <SpeakerWaveIcon className="w-14 h-14 text-purple-600 dark:text-purple-400" />
          </div>
        ))}
      </div>

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

      <Footer />
    </DefaultLayout>
  );
}
