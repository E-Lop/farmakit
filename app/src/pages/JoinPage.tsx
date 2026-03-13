import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAcceptInvite } from "@/hooks/useInvites";

export function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const acceptInvite = useAcceptInvite();
  const acceptedRef = useRef(false);

  useEffect(() => {
    if (authLoading || !code) return;

    if (!user) {
      navigate(`/login?invite=${code}`, { replace: true });
      return;
    }

    if (acceptedRef.current) return;
    acceptedRef.current = true;

    acceptInvite
      .mutateAsync(code)
      .then(() => {
        toast.success("Sei entrato nell'armadietto!");
        navigate("/cabinets", { replace: true });
      })
      .catch((err) => {
        toast.error(err.message || "Errore nell'accettazione dell'invito");
        navigate("/cabinets", { replace: true });
      });
  }, [authLoading, user, code]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent mb-6">
        <Archive className="h-10 w-10 text-primary" strokeWidth={1.5} />
      </div>

      {acceptInvite.isPending ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">
            Accettazione invito in corso...
          </p>
        </>
      ) : acceptInvite.isError ? (
        <>
          <h2 className="text-lg font-semibold mb-2">Invito non valido</h2>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {acceptInvite.error?.message ||
              "L'invito potrebbe essere scaduto o già utilizzato."}
          </p>
          <Button onClick={() => navigate("/cabinets", { replace: true })}>
            Vai agli armadietti
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </>
      )}
    </div>
  );
}
