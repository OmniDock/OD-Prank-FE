import { useMemo, useState, useCallback } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import BillingToggle from "@/components/pricing/BillingToggle";
import PlanCard, { Plan } from "@/components/pricing/PlanCard";
import FAQ from "@/components/pricing/FAQ";
import { useAuth } from "@/context/AuthProvider";
import { apiFetch } from "@/lib/api";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePublishableKey = import.meta.env.VITE_STRIPE_SB_PUBLIC_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;


export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const { user } = useAuth();
  const isLoggedIn = !!user;
  localStorage.setItem("loginFromPricing", isLoggedIn.toString())

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const fetchClientSecret = useCallback(() => {
    // Create a Checkout Session
    return apiFetch("/payment/checkout/create-session", {
      method: "POST",
    })
      .then((res) => {
        console.log("Checkout session response:", res);
        return res.json();
      })
      .then((data) => {
        console.log("Client secret data:", data);
        return data.client_secret;
      });
  }, []);

  const options = {fetchClientSecret};

  const plans = useMemo<Plan[]>(() => [
    {
      id: "free",
      name: "Free",
      tagline: "Get started and try it out",
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        "1 active scenario",
        "10 calls / month",
        "Basic voices",
        "Community support",
      ],
      ctaLabel: "Get Started",
      ctaHref: "/signup",
    },
    {
      id: "starter",
      name: "Starter",
      tagline: "For solo creators",
      priceMonthly: 12,
      priceAnnual: 120,
      features: [
        "5 active scenarios",
        "250 calls / month",
        "HD voices + effects",
        "Email support",
      ],
      popular: true,
      ctaLabel: "Start Free Trial",
      ctaHref: "/signup",
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "For growing teams",
      priceMonthly: 29,
      priceAnnual: 290,
      features: [
        "Unlimited scenarios",
        "2,500 calls / month",
        "Priority TTS rendering",
        "Priority support",
      ],
      ctaLabel: "Upgrade to Pro",
      ctaHref: "/signup",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      tagline: "Custom volume & SLAs",
      priceMonthly: null,
      priceAnnual: null,
      features: [
        "Unlimited everything",
        "Dedicated infra & SLAs",
        "SAML/SSO, audit logs",
        "Dedicated CSM",
      ],
      ctaLabel: "Contact Sales",
      ctaHref: "mailto:sales@example.com",
    },
  ], []);

  if (showCheckout) {
    return (
      <DefaultLayout>
        <AnimatedBackground variant="mixed" density={12} />
        <section className="relative flex flex-col items-center gap-8 pt-8 pb-4">
          <div className="text-center space-y-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">
              Checkout
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Complete your purchase
            </h1>
            <p className="text-default-500 max-w-2xl mx-auto">
              You're subscribing to the {selectedPlan?.name} plan
            </p>
          </div>
        </section>

        <section className="py-12">
          <div id="checkout" className="max-w-2xl mx-auto">
            {stripePromise ? (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={options}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            ) : (
              <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Stripe Configuration Error</h3>
                <p className="text-red-600">Stripe publishable key is not configured. Please check your environment variables.</p>
              </div>
            )}
          </div>
        </section>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <AnimatedBackground variant="mixed" density={12} />
      <section className="relative flex flex-col items-center gap-8 pt-8 pb-4">
        <div className="text-center space-y-4">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">
            Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-default-500 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Switch between monthly and annual billing at any time.
          </p>
        </div>

        <BillingToggle billing={billing} onChange={setBilling} />
      </section>

      <section className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((p) => (
            <PlanCard 
              key={p.id} 
              plan={p} 
              billing={billing} 
              onPlanSelect={handlePlanSelect}
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button as={Link} href="/signup" color="primary" variant="shadow" className="bg-gradient-primary">
            Create your account
          </Button>
          <p className="text-xs text-default-500 mt-2">No credit card required</p>
        </div>
      </section>

      <section className="py-16">
        <FAQ />
      </section>
    </DefaultLayout>
  );
}


