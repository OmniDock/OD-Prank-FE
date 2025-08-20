import { Outlet } from "react-router-dom";
import { Button, Link } from "@heroui/react";

export default function DashboardLayout() {
  return (
    <div className="h-screen w-screen grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-rows-1 lg:grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col border-r border-default-200 bg-content1">
        <div className="h-16 flex items-center px-4 text-lg font-semibold">Prankster</div>
        <nav className="flex-1 flex flex-col px-6 py-4 gap-2">
          <Button as={Link} href="/dashboard">Dashboard</Button>
          <Button as={Link} href="/dashboard/scenarios">Scenarios</Button>
          <Button as={Link} href="/dashboard/phone-call">Phone Call</Button>
        </nav>
      </aside>

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
