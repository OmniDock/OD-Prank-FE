import { useMemo, useState, useEffect } from "react";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import PlanCard from "@/components/pricing/PlanCard";
import { Plan } from "@/types/products";
import FAQ from "@/components/pricing/FAQ";
import { useAuth } from "@/context/AuthProvider";
import { getProductInfo } from "@/lib/api.stripe";
import { getProfile } from "@/lib/api.profile";

const STRIPE_SUBSCRIPTION_PORTAL_URL = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PORTAL_URL;


const valueBullets = [
  {
    title: "Unbegrenzte Ideen",
    description: "Vorlagen, eigene Skripte & Stimmenbibliothek – alles an einem Ort.",
  },
  {
    title: "Sichere Bezahlung",
    description: "Stripe Checkout, sofortige Bestätigung und monatlich kündbar.",
  },
  {
    title: "Team ready",
    description: "Teile Szenarien, arbeite gemeinsam und kombiniert eure Ideen.",
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const { user } = useAuth();
  const isLoggedIn = !!user;

  const constructedPlans = useMemo(() => {
    return plans.map((product: any) => ({
      id: product.id,
      name: product.id?.charAt?.(0)?.toUpperCase?.() + product.id?.slice?.(1) || product.id,
      displayName: product.displayName || product.name || product.id,
      type: product.type || "subscription",
      tagline: product.tagline,
      price: product.price,
      interval: product.interval,
      priceMonthly: null,
      priceAnnual: null,
      features: product.features,
      amount: 1,
      ctaLabel: product.ctaLabel,
      ctaHref: product.ctaHref,
      popular: product.popular,
    }));
  }, [plans]);

  // Entfernt das automatische Redirect, damit eingeloggte Nutzer die Seite sehen
  // und ihr Abo im Portal verwalten können.

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productData = await getProductInfo();
        const products = productData.products;
        setPlans(products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      if (isLoggedIn) {
        try {
          const profileData = await getProfile();
          setProfile(profileData);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          setProfile(null);
        }
      }
      setProfileLoading(false);
    };

    fetchProducts();
    fetchProfile();
  }, [isLoggedIn]);

  const hasActiveSubscription = useMemo(() => {
    return profile && profile.subscription_id !== null;
  }, [profile]);

  // Pläne nach Typ gruppieren und sortieren: Populär zuerst, dann nach Preis
  const { subscriptionPlans, oneTimePlans } = useMemo(() => {
    const byPopularityThenPrice = (a: Plan, b: Plan) => {
      const popA = a?.popular ? 1 : 0;
      const popB = b?.popular ? 1 : 0;
      if (popA !== popB) return popB - popA;
      const priceA = Number(a.price ?? 0);
      const priceB = Number(b.price ?? 0);
      return priceA - priceB;
    };

    const subs = constructedPlans
      .filter((p) => (p.type || "subscription").toLowerCase() === "subscription")
      .sort(byPopularityThenPrice);
    const oneTimes = constructedPlans
      .filter((p) => (p.type || "oneTime").toLowerCase() === "onetime")
      .sort(byPopularityThenPrice);

    return { subscriptionPlans: subs, oneTimePlans: oneTimes };
  }, [constructedPlans]);

  const handlePlanSelect = (plan: Plan, amount: number) => {
    if (hasActiveSubscription) {
      return;
    }

    localStorage.setItem("selectedPlanId", plan.id);
    localStorage.setItem("selectedPlanAmount", amount.toString());

    if (!isLoggedIn) {
      localStorage.setItem("FromPricing", "true");
      window.location.href = "/signin";
    } else {
      window.location.href = `/dashboard/profile?plan=${plan.id}&amount=${amount}`;
    }
  };

  return (
    <DefaultLayout>
      <AnimatedBackground variant="mixed" density={14} />

      <section className="relative px-4 pt-20 pb-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-gradient">
            Flexible Preise für deine besten Pranks
          </h1>
          <p className="max-w-2xl text-base sm:text-lg">
            Starte kostenlos, buche mehr Reichweite wann immer du willst und behalte deine Kosten im Blick.
            Jede Option enthält Zugriff auf unsere Bibliothek, Echtzeit-Analytics und sichere Stripe-Zahlung.
          </p>
      
        </div>
      </section>

      <section id="preise" className="relative px-4 pb-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          {isLoggedIn && !profileLoading && hasActiveSubscription && (
            <div className="rounded-2xl border border-success-200 bg-success-50/70 p-6 text-center shadow-sm">
              <p className="text-success font-semibold">Du hast bereits ein aktives Abonnement.</p>
              <p className="mt-1 text-sm text-success-600">
                Änderungen kannst du jederzeit im Stripe-Kundenportal vornehmen.
              </p>
              <Button
                className="mt-4"
                color="success"
                variant="flat"
                onPress={() => window.open(STRIPE_SUBSCRIPTION_PORTAL_URL, "_blank")}
              >
                Abonnement verwalten
              </Button>
            </div>
          )}


          {loading || profileLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-default-500">Tarife werden geladen...</div>
            </div>
          ) : constructedPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-default-200/60 bg-background/60 py-16 text-center">
              <div className="text-default-500">Aktuell sind keine Tarife verfügbar.</div>
              <div className="text-default-400 text-sm">Bitte versuche es später erneut.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[...oneTimePlans, ...subscriptionPlans].map((planData) => (
                <PlanCard
                  key={planData.id}
                  plan={planData}
                  billing="monthly"
                  onPlanSelect={handlePlanSelect}
                  disabled={hasActiveSubscription}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative px-4 pb-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-default-200/60 bg-background/80 p-8 shadow-lg backdrop-blur-lg sm:p-12">
          <div className="grid gap-8 sm:grid-cols-3">
            {valueBullets.map((item) => (
              <div key={item.title} className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-default-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    

      <section className="relative px-4 pb-20">
        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <FAQ />
        </div>
      </section>
    </DefaultLayout>
  );
}
