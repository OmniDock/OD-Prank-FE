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

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<PublicOnlyRoute />}>
        <Route element={<SignInPage />} path="/signin" />
        <Route element={<SignUpPage />} path="/signup" />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardMain />} />
          <Route path="scenarios" element={<ScenariosPage />} />
          <Route path="phone-call" element={<PhoneCallPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
