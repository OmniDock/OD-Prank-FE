import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import BillingToggle from "@/components/pricing/BillingToggle";
import PlanCard, { Plan } from "@/components/pricing/PlanCard";
import FAQ from "@/components/pricing/FAQ";
import { useAuth } from "@/context/AuthProvider";


export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const navigate = useNavigate();

  const { user, loading } = useAuth();
  const isLoggedIn = !!user;
  localStorage.setItem("loginFromPricing", isLoggedIn.toString())

  const handlePlanSelect = (plan: Plan) => {
    const currentPrice = billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
    
    console.log('Plan selected:', {
      id: plan.id,
      name: plan.name,
      price: currentPrice,
      billing: billing,
      features: plan.features,
      tagline: plan.tagline
    });
    const params = new URLSearchParams({
      planId: plan.id,
      planName: plan.name,
      price: currentPrice?.toString() || '0',
      billing: billing,
      tagline: plan.tagline,
      features: JSON.stringify(plan.features),
      priceMonthly: plan.priceMonthly?.toString() || '0',
      priceAnnual: plan.priceAnnual?.toString() || '0',
      popular: plan.popular?.toString() || 'false'
    });

    navigate(`/checkout?${params.toString()}`);
  };

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


