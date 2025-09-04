import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import SignInPage from "@/pages/signin";
import SignUpPage from "@/pages/signup";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import PublicOnlyRoute from "@/components/routing/PublicOnlyRoute";
import DashboardMain from "@/pages/dashboard/main";
import ScenariosPage from "@/pages/dashboard/scenarios";
import PhoneCallPage from "@/pages/dashboard/phone-call";
import DashboardLayout from "@/layouts/dashboard";
import ScenarioDetailPage from "@/pages/dashboard/scenarios-detail";
import ActiveCallPage from "@/pages/dashboard/active-call";
import BlacklistPage from "@/pages/blacklist";
import ImprintPage from "@/pages/imprint";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import PricingPage from "@/pages/pricing";
import CheckoutPage from "@/pages/checkout";

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
      <Route element={<PublicOnlyRoute />}>
        <Route element={<SignInPage />} path="/signin" />
        <Route element={<SignUpPage />} path="/signup" />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<CheckoutPage />} path="/checkout" />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardMain />} />
          <Route path="scenarios" element={<ScenariosPage />} />
          <Route path="scenarios/:id" element={<ScenarioDetailPage />} />
          <Route path="phone-call" element={<PhoneCallPage />} />
          <Route path="active-call" element={<ActiveCallPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
