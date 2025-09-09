import { useCallback, useState, useEffect } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import {Navigate, useNavigate, useSearchParams} from "react-router-dom";
import { Button } from "@heroui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import DefaultLayout from "@/layouts/default";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { Plan } from "@/types/products";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// test publishable API key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_SB_PUBLIC_KEY);

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  // Get plan ID from URL parameter or localStorage
  const planId = searchParams.get('id') || localStorage.getItem('selectedPlanId') || 'weekly';

  // Check if user should be redirected to checkout after login
  useEffect(() => {
    const shouldShowCheckout = searchParams.get('checkout') === 'true';
    if (shouldShowCheckout && isLoggedIn) {
      // Set a default plan (starter plan)
      const defaultPlan: Plan = {
        id: "starter",
        name: "Starter",
        tagline: "For solo creators",
        price: 12,
        interval: "month",
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
      };
      setSelectedPlan(defaultPlan);
      // Clean up the URL
      window.history.replaceState({}, '', '/checkout');
    }
  }, [isLoggedIn, searchParams]);

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/signin" replace />;
  }

  const fetchClientSecret = useCallback(() => {
    // Create a Checkout Session
    return apiFetch("/payment/checkout/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_type: planId,
        quantity: 1
      }),
    })
      .then((res) => {
        console.log("Checkout session response:", res);
        return res.json();
      })
      .then((data) => {
        console.log("Client secret data:", data.client_secret);

        return data.client_secret;
      });
  }, []);

  const options = {fetchClientSecret};

  const handleBackToPricing = () => {
    navigate("/pricing");
  };

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
            You're subscribing to the {selectedPlan?.name || "Starter"} plan
          </p>
        </div>
      </section>

      <section className="py-12">
        <div id="checkout" className="max-w-2xl mx-auto relative">
          {/* Back Arrow positioned on top of checkout form */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onClick={handleBackToPricing}
            className="absolute -top-12 left-0 z-10"
            aria-label="Back to pricing"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
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

export const Return = () => {
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    apiFetch(`/api/v1/payment/checkout/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      });
  }, []);

  if (status === 'open') {
    return (
      <Navigate to="/checkout" />
    )
  }

  if (status === 'complete') {
    return (
      <section id="success">
        <p>
          We appreciate your business! A confirmation email will be sent to {customerEmail}.

          If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
        </p>
      </section>
    )
  }

  return null;
}

