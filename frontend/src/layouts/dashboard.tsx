import { Outlet, NavLink } from "react-router-dom";
 
import { HomeIcon, QueueListIcon, PhoneIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function DashboardLayout() {
  return (
    <div className="h-screen w-screen grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-rows-1 lg:grid-cols-[10rem_1fr]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col border-r border-default-200 bg-content1">
        <div className="h-14 flex items-center gap-2.5 px-3">
          <img src="/android-chrome-192x192.png" alt="Logo" className="h-7 w-7 rounded-md" />
          <div className="text-base font-semibold truncate">Prankster</div>
        </div>
        <nav className="flex-1 flex flex-col px-2.5 py-3 gap-1">
          <NavItem to="/dashboard" icon={<HomeIcon className="h-5 w-5" />}>Dashboard</NavItem>
          <NavItem to="/dashboard/scenarios" icon={<QueueListIcon className="h-5 w-5" />}>Scenarios</NavItem>
          <NavItem to="/dashboard/phone-call" icon={<PhoneIcon className="h-5 w-5" />}>Phone Call</NavItem>
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

function NavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-medium px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary-50 text-primary-700 dark:bg-primary-100/10 dark:text-primary-400"
            : "hover:bg-default-100 text-default-700"
        )
      }
      end
    >
      {icon}
      <span className="truncate">{children}</span>
    </NavLink>
  );
}
