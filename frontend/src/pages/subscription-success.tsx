// import { useParams } from "react-router-dom";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export default function SubscriptionSuccessPage() {
  // const { sessionId } = useParams<{ sessionId: string }>();
  return (
    <DefaultLayout>
      <AnimatedBackground variant="mixed" density={12} />
      <section className="relative flex flex-col items-center gap-8 pt-8 pb-4">
        <div className="text-center space-y-4">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">
            Success
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Thanks for subscribing!
          </h1>
          <p className="text-default-500 max-w-2xl mx-auto">
            Your subscription is now active. You can start creating prank scenarios and making calls right away.
          </p>
        </div>
      </section>

      <section className="py-12 flex flex-col items-center gap-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/15 rounded-full mb-4">
            <svg 
              className="w-8 h-8 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Subscription Activated</h2>
          <p className="text-default-500 max-w-md">
            You now have access to all premium features
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
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
      </section>
    </DefaultLayout>
  );
}
