import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

// Use canvas-confetti for a richer celebration

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const navigate = useNavigate();

  useEffect(() => {
    const duration = 2800;
    const end = Date.now() + duration;

    const colors = ["#7C3AED", "#8B5CF6", "#A78BFA", "#06B6D4", "#F59E0B", "#10B981", "#EF4444"];

    function fire(particleRatio: number, opts: any) {
      confetti({
        spread: 360,
        ticks: 90,
        gravity: 0.9,
        decay: 0.94,
        startVelocity: 35,
        colors,
        particleCount: Math.floor(200 * particleRatio),
        scalar: 1.1,
        ...opts,
      });
    }

    // Initial center bursts
    fire(0.25, { origin: { y: 0.6 } });
    fire(0.2, { spread: 60, origin: { y: 0.6 } });
    fire(0.35, { spread: 100, startVelocity: 45, origin: { y: 0.6 } });
    fire(0.1, { spread: 120, scalar: 1.3, origin: { y: 0.6 } });
    fire(0.1, { spread: 120, scalar: 0.9, origin: { y: 0.6 } });

    // Side fireworks until time ends
    const interval = setInterval(() => {
      const timeLeft = end - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      const t = timeLeft / duration;
      confetti({
        particleCount: Math.round(40 * t),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: Math.round(40 * t),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
    }, 180);

    // Snow confetti overlay (white falling circles)
    let skew = 1;
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    let snowRaf = 0;
    const snowFrame = () => {
      const timeLeft = end - Date.now();
      const ticks = Math.max(200, 500 * (timeLeft / duration));
      skew = Math.max(0.8, skew - 0.001);

      confetti({
        particleCount: 1,
        startVelocity: 0,
        ticks,
        origin: {
          x: Math.random(),
          y: (Math.random() * skew) - 0.2,
        },
        colors: ['#ffffff'],
        shapes: ['circle'],
        gravity: randomInRange(0.4, 0.6),
        scalar: randomInRange(0.4, 1),
        drift: randomInRange(-0.4, 0.4),
      });

      if (timeLeft > 0) {
        snowRaf = requestAnimationFrame(snowFrame);
      }
    };
    snowRaf = requestAnimationFrame(snowFrame);

    const id = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, duration + 1500);
    return () => {
      clearInterval(interval);
      clearTimeout(id);
      cancelAnimationFrame(snowRaf);
    };
  }, [navigate]);
    
  return (
    <div>
      <AnimatedBackground variant="mixed" density={12} />
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center gap-8 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient animate-in">
            {type === 'purchase' ? 'Kauf erfolgreich!' : 'Abo erfolgreich!'}
          </h1>
          <p className="text-default-500 max-w-2xl mx-auto">
            {type === 'purchase' 
              ? 'Deine Credits wurden zu deinem Konto hinzugefügt. Du kannst sofort mit dem Erstellen von Prank und mit Anrufen beginnen.'
              : 'Dein Abonnement ist jetzt aktiv und Credits wurden zu deinem Konto hinzugefügt. Du kannst sofort mit dem Erstellen von Pranks und mit Anrufen beginnen.'
            }
          </p>
          <p className="text-sm text-default-400">Du wirst gleich weitergeleitet …</p>
        </div>
      </section>
    </div>
  );
}
