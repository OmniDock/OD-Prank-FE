import { NavLink } from "react-router-dom";
import { SparklesIcon, PhoneIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/icons";
import { Tooltip } from "@heroui/react";
import clsx from "clsx";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={clsx("hidden lg:flex flex-col bg-transparent shadow-xl rounded-2xl m-1 shadow-primary-500/10")}> 
      <div className={clsx("flex items-center gap-2.5", collapsed ? "h-14 px-3 justify-center" : "h-14 px-3")}> 
        <Logo size={28} />
        {!collapsed && <div className="text-base font-semibold truncate">Cally AI</div>}
      </div>

      <nav className={clsx("flex-1 flex flex-col gap-1", collapsed ? "px-1 py-2" : "px-2.5 py-3")}> 
        <NavItem to="/dashboard" icon={<SparklesIcon className="h-5 w-5" />} collapsed={collapsed} end>
          Dashboard
        </NavItem>
        <NavItem to="/dashboard/scenarios" icon={<ListBulletIcon className="h-5 w-5" />} collapsed={collapsed}>
          Scenarios
        </NavItem>
      </nav>


    </aside>
  );
}

function NavItem({ to, icon, children, collapsed, end }: { to: string; icon: React.ReactNode; children: React.ReactNode; collapsed: boolean; end?: boolean }) {
  const content = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-medium px-3 py-2 text-sm transition-colors border",
          isActive
            ? "bg-primary-500/10 border-primary-500/30 text-primary-700 dark:text-primary-400"
            : "hover:bg-white/40 dark:hover:bg-white/10 text-default-700 border-transparent",
          collapsed && "justify-center px-2"
        )
      }
      end={end}
    >
      {icon}
      {!collapsed && <span className="truncate">{children}</span>}
    </NavLink>
  );

  // Only show tooltip when sidebar is collapsed
  if (collapsed) {
    return (
      <Tooltip content={children} placement="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}

export default Sidebar;


