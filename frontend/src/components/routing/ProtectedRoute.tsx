import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";

export default function ProtectedRoute() {
	const { loading, user } = useAuth();
	const location = useLocation();

	if (loading) {
		return <div className="p-8">Loading...</div>;
	}

	if (!user) {
		return <Navigate to="/signin" state={{ from: location }} replace />;
	}

	return <Outlet />;
}
