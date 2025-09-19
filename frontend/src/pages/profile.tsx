import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import PlanCard from "@/components/pricing/PlanCard";
import LoadingScreen from "@/components/LoadingScreen";
import { getProfile } from "@/lib/api.profile";
import { getProductInfo } from "@/lib/api.stripe";
import { apiFetch } from "@/lib/api";
import type { Plan } from "@/types/products";
import { ProductTypes } from "@/types/products";

const STRIPE_SUBSCRIPTION_PORTAL_URL = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PORTAL_URL;
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_SB_PUBLIC_KEY);
const subscriptionDisplayNames: Record<string, string> = {
  weekly: "Wöchentliches Abo",
  monthly: "Monatliches Abo",
};

const getSubscriptionDisplayName = (value: string | null) => {
  if (!value) {
    return "";
  }
  return subscriptionDisplayNames[value] || value;
};

interface ProfileData {
  call_credits: number;
  created_at: string;
  prank_credits: number;
  profile_uuid: string;
  subscription_id: string | null;
  subscription_type: string | null;
  updated_at: string;
  user_email: string;
  user_id: string;
  cancel_at: number | null;
}

const buildPlan = (product: any): Plan => ({
  id: product.id,
  displayName: product.display_name || product.displayName || product.name || product.id,
  tagline: product.tagline || "",
  price: product.price,
  interval: product.interval || "",
  features: product.features || [],
  ctaLabel: product.ctaLabel || "",
  ctaHref: product.ctaHref || "",
  popular: product.popular || false,
  type: product.type || ProductTypes.SUBSCRIPTION,
});

const formatDate = (value: string | number) => {
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const selectedAmountFromSource = (plan: Plan, rawAmount?: string | null) => {
  if (plan.type === ProductTypes.SUBSCRIPTION) {
    return 1;
  }
  const parsed = Number(rawAmount);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(1);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (error: any) {
        setProfileError(error?.message || "Fehler beim Laden des Profils");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setPlanLoading(true);
        const productData = await getProductInfo();
        setProducts(productData.products || []);
        setPlanError(null);
      } catch (error: any) {
        setPlanError(error?.message || "Tarife konnten nicht geladen werden");
        setProducts([]);
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlans();
  }, []);

  const plans = useMemo(() => products.map(buildPlan), [products]);

  useEffect(() => {
    if (!plans.length) {
      return;
    }

    const paramPlanId = searchParams.get("plan");
    const storedPlanId = localStorage.getItem("selectedPlanId");
    const targetPlanId = paramPlanId || storedPlanId;

    if (!targetPlanId) {
      return;
    }

    const plan = plans.find((p) => p.id === targetPlanId);
    if (!plan) {
      return;
    }

    const amountParam = searchParams.get("amount") || localStorage.getItem("selectedPlanAmount");
    setSelectedPlan(plan);
    setSelectedAmount(selectedAmountFromSource(plan, amountParam));
  }, [plans, searchParams]);

  const hasActiveSubscription = Boolean(profile?.subscription_id);

  const handlePlanSelect = (plan: Plan, amount: number) => {
    setSelectedPlan(plan);
    setSelectedAmount(amount);
    setCheckoutError(null);
    localStorage.setItem("selectedPlanId", plan.id);
    localStorage.setItem("selectedPlanAmount", amount.toString());
  };

  const clearSelection = () => {
    setSelectedPlan(null);
    setCheckoutError(null);
    localStorage.removeItem("selectedPlanId");
    localStorage.removeItem("selectedPlanAmount");
  };

  const fetchClientSecret = useCallback(async () => {
    if (!selectedPlan) {
      throw new Error("Kein Plan ausgewählt");
    }

    try {
      const response = await apiFetch("/payment/checkout/create-session", {
        method: "POST",
        body: JSON.stringify({
          product_type: selectedPlan.id,
          quantity: selectedAmount,
        }),
      });
      const data = await response.json();
      setCheckoutError(null);
      return data.client_secret;
    } catch (error: any) {
      const message = error?.message || "Checkout konnte nicht gestartet werden";
      setCheckoutError(message);
      throw error;
    }
  }, [selectedPlan, selectedAmount]);

  const checkoutKey = useMemo(() => {
    if (!selectedPlan) {
      return "no-plan";
    }
    return `${selectedPlan.id}-${selectedAmount}`;
  }, [selectedPlan, selectedAmount]);

  if (profileLoading) {
    return <LoadingScreen message="Profil wird geladen..." />;
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <div className="text-danger text-lg font-semibold mb-2">Fehler</div>
            <div className="text-default-600">{profileError}</div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-default-600">Kein Profil gefunden</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-medium">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div>
              <h3 className="text-xl font-semibold">Kontoinformationen</h3>
              <p className="text-sm text-default-500">Deine persönlichen Daten</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="p-3 bg-default-50 rounded-lg">
              <span className="text-sm font-medium text-default-600">E-Mail-Adresse</span>
              <div className="text-lg font-medium text-foreground break-all">{profile.user_email}</div>
            </div>
            <div className="p-3 bg-default-50 rounded-lg">
              <span className="text-sm font-medium text-default-600">Mitglied seit</span>
              <div className="text-lg font-medium text-foreground">{formatDate(profile.created_at)}</div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="bg-gradient-to-r from-success/10 to-success/5">
            <div>
              <h3 className="text-xl font-semibold">Credits</h3>
              <p className="text-sm text-default-500">Dein aktuelles Guthaben</p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-default-600">Anruf-Credits</div>
                <div className="text-xs text-default-500">Für Telefonanrufe</div>
              </div>
              <div className="text-2xl font-bold text-success">{profile.call_credits}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-default-600">Prank-Credits</div>
                <div className="text-xs text-default-500">Für Streich-Szenarien</div>
              </div>
              <div className="text-2xl font-bold text-success">{profile.prank_credits}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-medium">
        <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5">
          <div>
            <h3 className="text-xl font-semibold">Abonnements & Checkout</h3>
            <p className="text-sm text-default-500">Wähle dein Paket und buche direkt im Dashboard</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {hasActiveSubscription ? (
            <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-center">
              <div className="text-success font-semibold mb-2">
                Aktiver Plan: {getSubscriptionDisplayName(profile.subscription_type)}
              </div>
              {profile.cancel_at ? (
                <div className="text-sm text-default-600">
                  Läuft bis {formatDate(profile.cancel_at)}
                </div>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  variant="solid"
                  onPress={() => window.open(STRIPE_SUBSCRIPTION_PORTAL_URL, "_blank")}
                >
                  Abonnement verwalten
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-default-200 bg-default-50/60 p-4 text-center text-sm text-default-600">
              Du hast noch kein Abonnement. Wähle unten einen Plan aus, um zu starten.
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Verfügbare Optionen</h4>
            {planLoading ? (
              <div className="text-default-500 text-sm">Tarife werden geladen...</div>
            ) : planError ? (
              <div className="text-danger text-sm">{planError}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    billing="monthly"
                    onPlanSelect={handlePlanSelect}
                    disabled={hasActiveSubscription}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedPlan && stripePromise ? (
            <div className="space-y-4 rounded-2xl border border-default-200 bg-default-50/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-default-500">Ausgewählter Plan</div>
                  <div className="text-lg font-semibold">{selectedPlan.displayName}</div>
                  {selectedPlan.type === ProductTypes.SUBSCRIPTION ? (
                    <div className="text-sm text-default-500 capitalize">Intervall: {selectedPlan.interval}</div>
                  ) : (
                    <div className="text-sm text-default-500">Anzahl: {selectedAmount}</div>
                  )}
                </div>
                <Button size="sm" variant="light" onPress={clearSelection}>
                  Auswahl entfernen
                </Button>
              </div>

              {checkoutError && (
                <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger">
                  {checkoutError}
                </div>
              )}

              <div className="rounded-xl border border-default-200 bg-background p-4">
                <EmbeddedCheckoutProvider
                  key={checkoutKey}
                  stripe={stripePromise}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            </div>
          ) : (!planLoading && !planError) ? (
            <div className="rounded-2xl border border-dashed border-default-200 p-4 text-center text-sm text-default-500">
              Wähle einen Plan aus, um den Checkout zu starten.
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
