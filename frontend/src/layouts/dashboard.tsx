import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "@/components/navigation/sidebar";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { Button } from "@heroui/react";
import { ArrowLeftIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthProvider";
import { useLocation } from "react-router-dom";
import UserDropdown from "@/pages/components/userDropdown";

export default function DashboardLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleSidebar() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  // Function to get dynamic title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Static mappings first
    const staticMappings: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/dashboard/scenarios": "Scenarios",
      "/dashboard/phone-call": "Phone Call",
    };
    
    if (staticMappings[path]) {
      return staticMappings[path];
    }
    
    if (/^\/dashboard\/scenarios\/[^/]+$/.test(path)) {
      return "Scenario Details";
    }

    return "Dashboard";
  };

  // Back icon only when nested beyond /dashboard/<section>
  const segments = location.pathname.split("/").filter(Boolean);
  const showBack = segments[0] === "dashboard" && segments.length > 2;
  const parentPath = "/" + segments.slice(0, segments.length - 1).join("/");
  const handleBack = () => navigate(parentPath);

  return (
    <div className={`h-screen w-screen grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-rows-1 ${collapsed ? "lg:grid-cols-[4rem_1fr]" : "lg:grid-cols-[10rem_1fr]"}`}>
      <AnimatedBackground variant="mixed" density={15} />
      {/* Sidebar */}
      <Sidebar collapsed={true} onToggle={toggleSidebar} />

      {/* Main */}
      <div className="flex flex-col min-h-0">
        {/* Topbar */}
        <header className="h-16 bg-transparent rounded-2xl mx-3 my-3 flex items-center justify-between px-4 shadow-xl shadow-primary-500/10">
          <div className="flex items-center gap-2">
            {showBack && (
              <Button isIconOnly size="sm" variant="light" onPress={handleBack} aria-label="Go back">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            )}
            <div className="font-semibold text-xl">{getPageTitle()}</div>
          </div>
          <div className="flex items-center gap-2">
            <UserDropdown />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
