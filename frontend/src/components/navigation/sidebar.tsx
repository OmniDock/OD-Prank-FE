import { NavLink } from "react-router-dom";
import { HomeIcon, QueueListIcon, PhoneIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={clsx("hidden lg:flex flex-col border-r border-default-200 bg-content1")}> 
      <div className={clsx("flex items-center gap-2.5", collapsed ? "h-14 px-3 justify-center" : "h-14 px-3")}> 
        <img src="/android-chrome-192x192.png" alt="Logo" className={clsx(collapsed ? "h-7 w-7" : "h-7 w-7", "rounded-md")} />
        {!collapsed && <div className="text-base font-semibold truncate">Prankster</div>}
      </div>

      <nav className={clsx("flex-1 flex flex-col gap-1", collapsed ? "px-1 py-2" : "px-2.5 py-3")}> 
        <NavItem to="/dashboard" icon={<HomeIcon className="h-5 w-5" />} collapsed={collapsed} end>
          Dashboard
        </NavItem>
        <NavItem to="/dashboard/scenarios" icon={<QueueListIcon className="h-5 w-5" />} collapsed={collapsed}>
          Scenarios
        </NavItem>
        <NavItem to="/dashboard/phone-call" icon={<PhoneIcon className="h-5 w-5" />} collapsed={collapsed}>
          Phone Call
        </NavItem>
      </nav>

      <div className={clsx("border-t border-default-200", collapsed ? "px-1 py-2" : "px-2.5 py-2")}> 
        <button
          type="button"
          onClick={onToggle}
          className={clsx(
            "w-full flex items-center justify-center gap-2 rounded-medium px-2 py-2 text-sm",
            "hover:bg-default-100 text-default-700"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeftIcon className={clsx("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, children, collapsed, end }: { to: string; icon: React.ReactNode; children: React.ReactNode; collapsed: boolean; end?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-medium px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary-50 text-primary-700 dark:bg-primary-100/10 dark:text-primary-400"
            : "hover:bg-default-100 text-default-700",
          collapsed && "justify-center px-2"
        )
      }
      end={end}
    >
      {icon}
      {!collapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );
}

export default Sidebar;


