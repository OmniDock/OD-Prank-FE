import { useMemo, useState, useEffect } from "react";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
// import BillingToggle from "@/components/pricing/BillingToggle";
import PlanCard from "@/components/pricing/PlanCard";
import { Plan } from "@/types/products";
import FAQ from "@/components/pricing/FAQ";
import { useAuth } from "@/context/AuthProvider";
import { getProductInfo } from "@/lib/api.stripe";
import { SubscriptionTypes } from "@/types/products";

export default function PricingPage() {
  // const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Fetch product information on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productData = await getProductInfo();
        const products = productData.products;
        
        const fetchedPlans: Plan[] = Object.entries(products).map(([key, product]: [string, any]) => {
          const price = product.prices[0];
          const unitAmount = price.unit_amount / 100; // Convert from cents
          const interval = price.recurring.interval;
          
          return {
            id: key.toLowerCase(), // Convert to lowercase for plan ID
            name: product.name,
            tagline: product.description,
            price: unitAmount,
            interval: interval,
            priceMonthly: null,
            priceAnnual: null,
            features: [
              "3 active scenarios",
              "15 calls per week",
              "basic voices"
            ],
            ctaLabel: "Get Started",
            ctaHref: "mailto:sales@example.com",
          };
        });
        
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Fallback to default plans if API fails
        setPlans(defaultPlans);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const handlePlanSelect = (plan: Plan) => {
    // Save the selected plan ID for checkout
    localStorage.setItem("selectedPlanId", plan.id);
    
    if (!isLoggedIn) {
      // Redirect to login if user is not authenticated
      localStorage.setItem("FromPricing", "true");
      window.location.href = "/signin";
    } else {
      // Redirect to checkout page with plan ID
      window.location.href = `/checkout?id=${plan.id}`;
    }
  };

  // Default plans fallback
  const defaultPlans: Plan[] = [
    // {
    //   id: "free",
    //   name: "Free",
    //   tagline: "Get started and try it out",
    //   price: 0,
    //   interval: "week",
    //   priceMonthly: 0,
    //   priceAnnual: 0,
    //   features: [
    //     "1 active scenario",
    //     "10 calls / month",
    //     "Basic voices",
    //   ],
    //   ctaLabel: "Get Started",
    //   ctaHref: "/signup",
    // },
    {
      id: SubscriptionTypes.WEEKLY,
      name: "Weekly",
      tagline: "For weekly users",
      price: 4.99,
      interval: "week",
      priceMonthly: null,
      priceAnnual: null,
      features: [
        "3 active scenarios",
        "15 calls per week",
        "basic voices"
      ],
      ctaLabel: "Get Started",
      ctaHref: "mailto:sales@example.com",
    },
    {
      id: SubscriptionTypes.MONTHLY,
      name: "Monthly",
      tagline: "For prankster",
      price: 17.99,
      interval: "month",
      priceMonthly: null,
      priceAnnual: null,
      features: [
        "5 active scenarios",
        "100 calls per week",
        "access to all voices"
      ],
      ctaLabel: "Get Started",
      ctaHref: "mailto:sales@example.com",
    },
    {
      id: SubscriptionTypes.YEARLY,
      name: "Yearly",
      tagline: "For true pranksters",
      price: 179.99,
      interval: "year",
      priceMonthly: null,
      priceAnnual: null,
      features: [
        "unlimitedactive scenarios",
        "unlimited calls ",
        "access to all voices"
      ],
      ctaLabel: "Get Started",
      ctaHref: "mailto:sales@example.com",
    },
    // {
    //   id: "starter",
    //   name: "Starter",
    //   tagline: "For solo creators",
    //   priceMonthly: 12,
    //   priceAnnual: 120,
    //   features: [
    //     "5 active scenarios",
    //     "250 calls / month",
    //     "HD voices + effects",
    //     "Email support",
    //   ],
    //   popular: true,
    //   ctaLabel: "Start Free Trial",
    //   ctaHref: "/signup",
    // },
    // {
    //   id: "pro",
    //   name: "Pro",
    //   tagline: "For growing teams",
    //   priceMonthly: 29,
    //   priceAnnual: 290,
    //   features: [
    //     "Unlimited scenarios",
    //     "2,500 calls / month",
    //     "Priority TTS rendering",
    //     "Priority support",
    //   ],
    //   ctaLabel: "Upgrade to Pro",
    //   ctaHref: "/signup",
    // },
    // {
    //   id: "enterprise",
    //   name: "Enterprise",
    //   tagline: "Custom volume & SLAs",
    //   priceMonthly: null,
    //   priceAnnual: null,
    //   features: [
    //     "Unlimited everything",
    //     "Dedicated infra & SLAs",
    //     "SAML/SSO, audit logs",
    //     "Dedicated CSM",
    //   ],
    //   ctaLabel: "Contact Sales",
    //   ctaHref: "mailto:sales@example.com",
    // },
  ];

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
            Choose the plan that fits your needs.
            {/* Switch between monthly and annual billing at any time. */}
          </p>
        </div>

        {/* <BillingToggle billing={billing} onChange={setBilling} /> */}
      </section>

      <section className="py-12">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-default-500">Loading plans...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mx-auto max-w-5xl">
            {plans.map((p) => (
              <PlanCard 
                key={p.id} 
                plan={p} 
                billing={"monthly"} 
                onPlanSelect={handlePlanSelect}
              />
            ))}
          </div>
        )}
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


