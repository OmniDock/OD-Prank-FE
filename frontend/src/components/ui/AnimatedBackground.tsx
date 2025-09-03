import { useMemo } from "react";
import { PhoneIcon, ChatBubbleLeftRightIcon, SpeakerWaveIcon } from "@heroicons/react/24/solid";

interface AnimatedBackgroundProps {
  variant?: "phones" | "speakers" | "mixed";
  density?: number;
  className?: string;
}

export default function AnimatedBackground({
  variant = "mixed",
  density = 15,
  className = ""
}: AnimatedBackgroundProps) {
  const floatingPhones = useMemo(
    () =>
      Array.from({ length: variant === "speakers" ? 0 : density }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 10,
      })),
    [density, variant]
  );

  const floatingSpeakers = useMemo(
    () =>
      Array.from({ length: variant === "phones" ? 0 : density }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 10 + 5,
        duration: 20 + Math.random() * 10,
      })),
    [density, variant]
  );

  const floatingChats = useMemo(
    () =>
      Array.from({ length: variant === "mixed" ? Math.max(0, Math.floor(density / 2)) : 0 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 25 + Math.random() * 10,
      })),
    [density, variant]
  );

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 opacity-20" />
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      {floatingPhones.map((phone) => (
        <div
          key={`phone-${phone.id}`}
          className="absolute opacity-[0.05] dark:opacity-[0.09] animate-float"
          style={{
            left: `${phone.left}%`,
            top: `${phone.top}%`,
            animationDelay: `${phone.delay}s`,
            animationDuration: `${phone.duration}s`,
          }}
        >
          <PhoneIcon className="w-14 h-14 text-purple-600 dark:text-purple-400" />
        </div>
      ))}

      {floatingSpeakers.map((speaker) => (
        <div
          key={`speaker-${speaker.id}`}
          className="absolute opacity-[0.05] dark:opacity-[0.09] animate-float"
          style={{
            left: `${speaker.left}%`,
            top: `${speaker.top}%`,
            animationDelay: `${speaker.delay}s`,
            animationDuration: `${speaker.duration}s`,
          }}
        >
          <SpeakerWaveIcon className="w-14 h-14 text-purple-600 dark:text-purple-400" />
        </div>
      ))}

      {floatingChats.map((chat) => (
        <div
          key={`chat-${chat.id}`}
          className="absolute opacity-[0.05] dark:opacity-[0.09] animate-float"
          style={{
            left: `${chat.left}%`,
            top: `${chat.top}%`,
            animationDelay: `${chat.delay}s`,
            animationDuration: `${chat.duration}s`,
          }}
        >
          <ChatBubbleLeftRightIcon className="w-14 h-14 text-purple-600 dark:text-purple-400" />
        </div>
      ))}
    </div>
  );
}


