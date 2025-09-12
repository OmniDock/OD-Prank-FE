import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "@/components/navigation/sidebar";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { Button } from "@heroui/react";
import { ArrowLeftIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthProvider";
import { useLocation } from "react-router-dom";
import UserDropdown from "@/components/ui/userDropdown";

export default function DashboardLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);


  // Function to get dynamic title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    
    // Static mappings first
    const staticMappings: Record<string, string> = {
      "/dashboard": "",
      "/dashboard/scenarios": "",
      "/dashboard/phone-call": "",
    };
    
    if (staticMappings[path]) {
      return staticMappings[path];
    }
    
    if (/^\/dashboard\/scenarios\/[^/]+$/.test(path)) {
      return "";
    }

    return "";
  };

  // Back icon only when nested beyond /dashboard/<section>
  const segments = location.pathname.split("/").filter(Boolean);
  const showBack = segments[0] === "dashboard" && segments.length > 2;
  const parentPath = "/" + segments.slice(0, segments.length - 1).join("/");
  const handleBack = () => navigate(parentPath);

  return (
    <div className={`h-screen w-screen grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-rows-1 ${collapsed ? "lg:grid-cols-[auto_1fr]" : "lg:grid-cols-[10rem_1fr]"}`}>
      <AnimatedBackground variant="mixed" density={15} />
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Main */}
      <div className="flex  flex-col min-h-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-12 bg-transparent rounded-2xl mx-3 mt-3 mb-2 flex items-center justify-between px-4 ">
          <div className="flex items-center gap-2">
            {showBack && (
              <Button isIconOnly size="sm" variant="light" onPress={handleBack} aria-label="Go back">
                <ArrowLeftIcon className="h-6 w-6 text-default-500" />
              </Button>
            )}
            <div className="font-semibold text-xl">{getPageTitle()}</div>
          </div>
          <div className="flex items-center gap-2">
            <UserDropdown />
          </div>
        </header>
        <main className="flex-1 overflow-auto px-4 pb-4 lg:px-6 lg:pb-6"><Outlet /></main>
      </div>
    </div>
  );
}
