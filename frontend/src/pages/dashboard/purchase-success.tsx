import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { useSearchParams } from "react-router-dom";

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
    
  return (
    <div>
      <AnimatedBackground variant="mixed" density={12} />
      <section className="relative flex flex-col items-center gap-8 pt-8 pb-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {type === 'purchase' ? 'Kauf erfolgreich!' : 'Abo erfolgreich!'}
          </h1>
          <p className="text-default-500 max-w-2xl mx-auto">
            {type === 'purchase' 
              ? 'Deine Credits wurden zu deinem Konto hinzugefügt. Du kannst sofort mit dem Erstellen von Prank und mit Anrufen beginnen.'
              : 'Dein Abonnement ist jetzt aktiv und Credits wurden zu deinem Konto hinzugefügt. Du kannst sofort mit dem Erstellen von Pranks und mit Anrufen beginnen.'
            }
          </p>
        </div>
      </section>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          as={Link} 
          href="/dashboard" 
          color="primary" 
          variant="shadow" 
          className="bg-gradient-primary px-8 py-3 text-lg font-semibold"
        >
          Start Pranking!
        </Button>
        </div>
    </div>
  );
}
