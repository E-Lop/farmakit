import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <BottomNav />
    </div>
  );
}
