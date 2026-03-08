import { NavLink, useSearchParams } from "react-router-dom";
import { Home, Archive, ScanLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/cabinets", icon: Archive, label: "Armadietti" },
  { to: "/scan", icon: ScanLine, label: "Scansiona", propagateCabinet: true },
  { to: "/settings", icon: Settings, label: "Impostazioni" },
];

export function BottomNav() {
  const [searchParams] = useSearchParams();
  const activeCabinet = searchParams.get("cabinet");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map(({ to, icon: Icon, label, end, propagateCabinet }) => {
          const href =
            propagateCabinet && activeCabinet
              ? `${to}?cabinet=${activeCabinet}`
              : to;

          return (
            <NavLink
              key={to}
              to={href}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
