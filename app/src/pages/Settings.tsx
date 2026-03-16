import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { usePushSubscription, type PushStatus } from "@/hooks/usePushSubscription";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  User,
  Bell,
  BellOff,
  Clock,
  AlertTriangle,
  Smartphone,
  Shield,
} from "lucide-react";

const EXPIRY_INTERVAL_OPTIONS = [
  { value: 30, label: "30 giorni" },
  { value: 7, label: "7 giorni" },
  { value: 3, label: "3 giorni" },
  { value: 1, label: "1 giorno" },
  { value: 0, label: "Giorno stesso" },
];

const QUIET_HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, "0")}:00`,
}));

function PushStatusBadge({ status }: { status: PushStatus }) {
  switch (status) {
    case "subscribed":
      return <Badge variant="default">Attive</Badge>;
    case "denied":
      return <Badge variant="destructive">Bloccate</Badge>;
    case "ios-not-installed":
      return <Badge variant="secondary">Installa app</Badge>;
    case "unsupported":
      return <Badge variant="secondary">Non supportate</Badge>;
    default:
      return <Badge variant="outline">Disattivate</Badge>;
  }
}

function PushStatusMessage({ status }: { status: PushStatus }) {
  switch (status) {
    case "denied":
      return (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          Permesso negato. Riabilitalo dalle impostazioni del browser.
        </p>
      );
    case "ios-not-installed":
      return (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Smartphone className="mt-0.5 h-3 w-3 shrink-0" />
          Su iOS, aggiungi l&apos;app alla Schermata Home per ricevere notifiche.
        </p>
      );
    case "unsupported":
      return (
        <p className="text-xs text-muted-foreground">
          Il tuo browser non supporta le push notifications.
        </p>
      );
    default:
      return null;
  }
}

export function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { status, isLoading: pushLoading, subscribe, unsubscribe } = usePushSubscription();
  const { data: prefs } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const canTogglePush = status === "prompt" || status === "subscribed";

  function handleTogglePush() {
    if (status === "subscribed") {
      unsubscribe();
    } else {
      subscribe();
    }
  }

  function toggleInterval(days: number) {
    if (!prefs) return;
    const current = prefs.expiry_intervals;
    const next = current.includes(days)
      ? current.filter((d) => d !== days)
      : [...current, days].sort((a, b) => b - a);
    updatePrefs.mutate({ expiry_intervals: next });
  }

  function handleQuietHoursToggle(enabled: boolean) {
    updatePrefs.mutate({ quiet_hours_enabled: enabled });
  }

  function handleQuietHoursChange(field: "quiet_hours_start" | "quiet_hours_end", value: number) {
    updatePrefs.mutate({ [field]: value });
  }

  return (
    <>
      <Header title="Impostazioni" />
      <PageLayout>
        <div className="space-y-6 pt-2 animate-fade-in">
          {/* Account */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <User className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">
                Account
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Notifiche */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status === "subscribed" ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <h3 className="text-sm font-medium">Notifiche push</h3>
              </div>
              <PushStatusBadge status={status} />
            </div>

            <PushStatusMessage status={status} />

            {canTogglePush && (
              <div className="flex items-center justify-between">
                <Label htmlFor="push-toggle" className="text-sm">
                  Ricevi notifiche scadenze
                </Label>
                <Switch
                  id="push-toggle"
                  checked={status === "subscribed"}
                  onCheckedChange={handleTogglePush}
                  disabled={pushLoading}
                />
              </div>
            )}

            {/* Intervalli scadenza */}
            {status === "subscribed" && prefs && (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Avvisami prima della scadenza
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXPIRY_INTERVAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleInterval(opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        prefs.expiry_intervals.includes(opt.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Quiet hours */}
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label
                        htmlFor="quiet-hours"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Ore di silenzio
                      </Label>
                    </div>
                    <Switch
                      id="quiet-hours"
                      size="sm"
                      checked={prefs.quiet_hours_enabled}
                      onCheckedChange={handleQuietHoursToggle}
                    />
                  </div>
                  {prefs.quiet_hours_enabled && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Dalle</span>
                      <select
                        value={prefs.quiet_hours_start}
                        onChange={(e) =>
                          handleQuietHoursChange(
                            "quiet_hours_start",
                            Number(e.target.value),
                          )
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {QUIET_HOURS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span>alle</span>
                      <select
                        value={prefs.quiet_hours_end}
                        onChange={(e) =>
                          handleQuietHoursChange(
                            "quiet_hours_end",
                            Number(e.target.value),
                          )
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {QUIET_HOURS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin */}
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate("/admin/contributions")}
            >
              <Shield className="h-4 w-4" />
              Moderazione contribuzioni
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Farmakit v0.2.0
          </p>
        </div>
      </PageLayout>
    </>
  );
}
