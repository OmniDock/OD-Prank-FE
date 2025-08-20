import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import SignInPage from "@/pages/signin";
import SignUpPage from "@/pages/signup";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardMain from "@/pages/dashboard/main";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<SignInPage />} path="/signin" />
      <Route element={<SignUpPage />} path="/signup" />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardMain />} path="/dashboard" />
      </Route>
    </Routes>
  );
}

export default App;
