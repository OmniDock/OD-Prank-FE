import { Route, Routes, Navigate } from "react-router-dom";

import IndexPage from "@/pages/index";
import SignInPage from "@/pages/signin";
import SignUpPage from "@/pages/signup";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import PublicOnlyRoute from "@/components/routing/PublicOnlyRoute";
import DashboardMain from "@/pages/dashboard/main";
import ScenariosPage from "@/pages/dashboard/scenarios";
import DashboardLayout from "@/layouts/dashboard";
import ScenarioDetailPage from "@/pages/dashboard/scenarios-detail";
import ActiveCallPage from "@/pages/dashboard/active-call";
import BlacklistPage from "@/pages/blacklist";
import ImprintPage from "@/pages/imprint";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import PricingPage from "@/pages/pricing";
import CheckoutStandalonePage from "@/pages/dashboard/checkout-standalone";
import PricingStandalonePage from "@/pages/dashboard/pricing-standalone";
import ProfilePage from "@/pages/profile";
import SubscriptionSuccessPage from "@/pages/dashboard/purchase-success";
import TemplateDetailPage from "@/pages/templates-detail";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      {/* Public legal pages */}
      <Route element={<TermsPage />} path="/terms" />
      <Route element={<ImprintPage />} path="/imprint" />
      <Route element={<PrivacyPage />} path="/privacy" />
      <Route element={<BlacklistPage />} path="/blacklist" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<Navigate to="/dashboard/profile" replace />} path="/profile" />
      <Route element={<TemplateDetailPage />} path="/templates/:id" />
      <Route element={<PublicOnlyRoute />}>
        <Route element={<SignInPage />} path="/signin" />
        <Route element={<SignUpPage />} path="/signup" />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<CheckoutStandalonePage />} path="/dashboard/checkout" />
        <Route element={<PricingStandalonePage />} path="/dashboard/pricing" />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardMain />} />
          <Route path="scenarios" element={<ScenariosPage />} />
          <Route path="scenarios/:id" element={<ScenarioDetailPage />} />
          <Route path="active-call" element={<ActiveCallPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="purchase-success/:sessionId" element={<SubscriptionSuccessPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
