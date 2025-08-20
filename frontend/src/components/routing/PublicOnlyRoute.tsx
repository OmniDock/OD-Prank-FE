import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";

export default function PublicOnlyRoute() {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
