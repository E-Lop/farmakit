import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Settings() {
  const { user, signOut } = useAuth();

  return (
    <>
      <Header title="Impostazioni" />
      <PageLayout>
        <div className="space-y-6 pt-2 animate-fade-in">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <User className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">Account</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Farmakit v0.1.0
          </p>
        </div>
      </PageLayout>
    </>
  );
}
