import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "@/components/navigation/sidebar";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(false);

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

  return (
    <div className={`h-screen w-screen grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-rows-1 ${collapsed ? "lg:grid-cols-[4rem_1fr]" : "lg:grid-cols-[10rem_1fr]"}`}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Main */}
      <div className="flex flex-col min-h-0">
        {/* Topbar */}
        <header className="h-16 border-b border-default-200 bg-content1 flex items-center justify-between px-4">
          <div className="text-sm text-default-500" />
          <div className="flex items-center gap-2">
            {/* Placeholder for actions/user menu */}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
