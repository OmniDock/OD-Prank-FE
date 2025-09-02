import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useAuth } from "@/context/AuthProvider";
import { Logo } from "@/components/icons";

export default function LandingNavbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 max-w-7xl mx-auto">
      <nav
        className={[
          "transition-all duration-300 ease-in-out transform-gpu",
          "container mx-auto flex items-center justify-between ",
          "border border-transparent dark:border-transparent",
          scrolled
            ? "max-w-6xl mt-3 px-6 py-6 rounded-full shadow-lg border-white/20 dark:border-white/10 bg-white dark:bg-neutral-900/60 shadow-primary-300 shadow-lg"
            : "max-w-7xl px-6 py-6 bg-white",
          scrolled ? "scale-100" : "scale-100",
        ].join(" ")}
      >
        <Link href="/" color="foreground" className="flex items-center gap-2">
          <Logo size={scrolled ? 32 : 32} />
          <span
            className={[
              "font-semibold transition-all duration-300 text-gradient",
              scrolled ? "text-2xl" : "text-2xl",
            ].join(" ")}
          >
            Call It AI
          </span>
        </Link>

        {user ? (
          <Button
            as={Link}
            href="/dashboard"
            color="primary"
            variant="solid"
            size={scrolled ? "md" : "md"}
            className="bg-gradient-primary"
          >
            Dashboard
          </Button>
        ) : (
          <Button
            as={Link}
            href="/signin"
            color="primary"
            variant="shadow"
            size={scrolled ? "md" : "md"}
            className="bg-gradient-primary"
          >
            Sign In
          </Button>
        )}
      </nav>
    </div>
  );
}