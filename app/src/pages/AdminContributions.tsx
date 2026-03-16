import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useIsAdmin,
  usePendingContributions,
  useModerateContribution,
  type PendingContribution,
} from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Search,
  Users,
} from "lucide-react";

function TrustBadge({ weight }: { weight: number }) {
  if (weight >= 0.8)
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        {weight.toFixed(2)}
      </Badge>
    );
  if (weight >= 0.5)
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-500 text-white">
        {weight.toFixed(2)}
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1">
      {weight.toFixed(2)}
    </Badge>
  );
}

function ContributionTypeLabel({ type }: { type: string }) {
  switch (type) {
    case "new_medicine":
      return <Badge variant="outline">Nuovo farmaco</Badge>;
    case "barcode_add":
      return <Badge variant="outline">Barcode</Badge>;
    case "correction":
      return <Badge variant="outline">Correzione</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

// Hook per arricchire le contribuzioni con trust weight e cross-check
function useEnrichedContributions(contributions: PendingContribution[]) {
  // Carica trust weights e cross-check per ogni contribuzione (in parallelo)
  return useQuery({
    queryKey: [
      "admin-enriched-contributions",
      contributions.map((c) => c.id).join(","),
    ],
    queryFn: async () => {
      const enriched = await Promise.all(
        contributions.map(async (contrib) => {
          const normalizedName = contrib.data.name
            ? contrib.data.name
                .toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            : null;

          const [twResult, cwResult, catalogResult] = await Promise.all([
            supabase.rpc("user_trust_weight", {
              p_user_id: contrib.user_id,
            }),
            supabase.rpc("contribution_cluster_weight", {
              p_contribution_type: contrib.contribution_type,
              p_barcode: contrib.data.barcode || null,
              p_normalized_name: normalizedName,
            }),
            contrib.data.barcode
              ? supabase
                  .from("medicines")
                  .select("id, name, barcode")
                  .eq("barcode", contrib.data.barcode)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...contrib,
            trust_weight:
              typeof twResult.data === "number" ? twResult.data : 1.0,
            cluster_weight:
              typeof cwResult.data === "number" ? cwResult.data : 0,
            catalog_match: catalogResult.data,
          };
        }),
      );

      return enriched;
    },
    enabled: contributions.length > 0,
  });
}

function ContributionCard({
  contribution,
  onModerate,
  isPending,
}: {
  contribution: PendingContribution;
  onModerate: (id: string, action: "approve" | "reject") => void;
  isPending: boolean;
}) {
  const { data } = contribution;
  const trust = contribution.trust_weight ?? 1.0;
  const cluster = contribution.cluster_weight ?? 0;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Header: trust + cluster */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Trust</span>
          <TrustBadge weight={trust} />
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Cluster: {cluster.toFixed(1)}/3.0
          </span>
        </div>
      </div>

      {/* Tipo + dati */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ContributionTypeLabel type={contribution.contribution_type} />
          <span className="text-xs text-muted-foreground">
            {new Date(contribution.created_at).toLocaleDateString("it-IT")}
          </span>
        </div>
        {data.name && (
          <p className="text-sm font-medium">{data.name}</p>
        )}
        {data.barcode && (
          <p className="font-mono text-xs text-muted-foreground">
            EAN: {data.barcode}
          </p>
        )}
        {data.active_ingredient && (
          <p className="text-xs text-muted-foreground">
            P.A.: {data.active_ingredient}
          </p>
        )}
        {data.manufacturer && (
          <p className="text-xs text-muted-foreground/70">
            {data.manufacturer}
          </p>
        )}
      </div>

      {/* Cross-check alerts */}
      {contribution.catalog_match && (
        <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-2 text-xs dark:bg-yellow-950/30">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-yellow-600" />
          <span>
            Barcode già presente: &quot;{contribution.catalog_match.name}&quot;
          </span>
        </div>
      )}

      {cluster >= 3.0 && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 p-2 text-xs dark:bg-green-950/30">
          <Search className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
          <span>Soglia consenso raggiunta — approvazione automatica imminente</span>
        </div>
      )}

      {/* Utente */}
      <p className="text-xs text-muted-foreground">
        Utente: {contribution.user_id.slice(0, 8)}...
      </p>

      {/* Azioni */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1 text-destructive"
          onClick={() => onModerate(contribution.id, "reject")}
          disabled={isPending}
        >
          <X className="h-3 w-3" />
          Rifiuta
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onModerate(contribution.id, "approve")}
          disabled={isPending}
        >
          <Check className="h-3 w-3" />
          Approva
        </Button>
      </div>
    </div>
  );
}

export function AdminContributions() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { data: rawContributions = [], isLoading } =
    usePendingContributions();
  const { data: enrichedContributions } =
    useEnrichedContributions(rawContributions);
  const moderate = useModerateContribution();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, navigate]);

  function handleModerate(id: string, action: "approve" | "reject") {
    moderate.mutate(
      { contributionId: id, action },
      {
        onSuccess: () => {
          toast.success(
            action === "approve"
              ? "Contribuzione approvata"
              : "Contribuzione rifiutata",
          );
        },
        onError: () => {
          toast.error("Errore nella moderazione");
        },
      },
    );
  }

  if (!isAdmin) return null;

  const contributions = enrichedContributions ?? rawContributions;

  return (
    <>
      <Header title="Moderazione" showBack />
      <PageLayout>
        <div className="space-y-4 pt-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Contribuzioni in attesa
            </h2>
            <Badge variant="secondary">
              {rawContributions.length}
            </Badge>
          </div>

          {isLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Caricamento...
            </div>
          )}

          {!isLoading && contributions.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Nessuna contribuzione in attesa di revisione.
            </div>
          )}

          {contributions.map((c) => (
            <ContributionCard
              key={c.id}
              contribution={c}
              onModerate={handleModerate}
              isPending={moderate.isPending}
            />
          ))}
        </div>
      </PageLayout>
    </>
  );
}
