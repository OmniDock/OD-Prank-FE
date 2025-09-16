import { useMemo, useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import PlanCard from "@/components/pricing/PlanCard";
import { Plan } from "@/types/products";
import FAQ from "@/components/pricing/FAQ";
import { useAuth } from "@/context/AuthProvider";
import { getProductInfo } from "@/lib/api.stripe";
import { getProfile } from "@/lib/api.profile";
import UserDropdown from "@/components/ui/userDropdown";

const STRIPE_SUBSCRIPTION_PORTAL_URL = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PORTAL_URL;

export default function PricingStandalonePage() {
  // const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const { user } = useAuth();
  const isLoggedIn = !!user;
  const navigate = useNavigate();

  // Memoized plan construction to prevent recreation on every render
  const constructedPlans = useMemo(() => {
    return plans.map((product: any) => ({
      id: product.id,
      name: product.id.charAt(0).toUpperCase() + product.id.slice(1), // Capitalize first letter
      tagline: product.tagline,
      price: product.price,
      interval: product.interval,
      priceMonthly: null,
      priceAnnual: null,
      features: product.features,
      ctaLabel: product.ctaLabel,
      ctaHref: product.ctaHref,
    }));
  }, [plans]);

  // Fetch product information and profile on mount
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

  // Check if user has an active subscription
  const hasActiveSubscription = useMemo(() => {
    return profile && profile.subscription_id !== null;
  }, [profile]);

  const handlePlanSelect = (plan: Plan) => {
    // Block selection if user has active subscription (except for single plan)
    if (hasActiveSubscription && plan.id !== 'single') {
      return;
    }
    
    // Save the selected plan ID for checkout
    localStorage.setItem("selectedPlanId", plan.id);
    
    if (!isLoggedIn) {
      // Redirect to login if user is not authenticated
      localStorage.setItem("FromPricing", "true");
      window.location.href = "/signin";
    } else {
      // Redirect to checkout page with plan ID
      window.location.href = `/dashboard/checkout?id=${plan.id}`;
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground variant="mixed" density={12} />
      
      {/* Top bar with back arrow and profile dropdown */}
      <div className="relative z-10 flex justify-between items-center p-4">
        <Button
          variant="light"
          size="sm"
          onClick={handleBackToDashboard}
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Dashboard
        </Button>
        <UserDropdown />
      </div>

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
        {/* Show subscription message if user has active subscription */}
        {isLoggedIn && !profileLoading && hasActiveSubscription && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 text-center">
              <p className="text-black mb-3">Du hast bereits ein Abonnement.</p>
              <Button 
                color="success" 
                size="sm"
                onPress={() => window.open(STRIPE_SUBSCRIPTION_PORTAL_URL, '_blank')}
              >
                Abonnement verwalten
              </Button>
            </div>
          </div>
        )}

        {loading || profileLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-default-500">Loading plans...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mx-auto max-w-5xl">
            {constructedPlans.map((p) => (
              <PlanCard 
                key={p.id} 
                plan={p} 
                billing={"monthly"} 
                onPlanSelect={handlePlanSelect}
                disabled={hasActiveSubscription}
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
    </div>
  );
}
