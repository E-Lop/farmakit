import { Users, Crown, UserMinus } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCabinetMembers, useRemoveMember } from "@/hooks/useInvites";
import { useAuth } from "@/hooks/useAuth";

interface MembersSheetProps {
  cabinetId: string;
  cabinetName: string;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersSheet({
  cabinetId,
  cabinetName,
  isOwner,
  open,
  onOpenChange,
}: MembersSheetProps) {
  const { user } = useAuth();
  const { data: members, isLoading } = useCabinetMembers(
    open ? cabinetId : undefined,
  );
  const removeMutation = useRemoveMember();

  const handleRemove = async (userId: string) => {
    try {
      await removeMutation.mutateAsync({ cabinetId, userId });
      toast.success("Membro rimosso");
    } catch {
      toast.error("Errore nella rimozione");
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membri
          </DrawerTitle>
          <DrawerDescription>
            Membri di &quot;{cabinetName}&quot;
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {members?.map((member) => {
                const isCurrentUser = member.user_id === user?.id;
                const isMemberOwner = member.role === "owner";

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium">
                        {isMemberOwner ? (
                          <Crown className="h-4 w-4 text-primary" />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {isCurrentUser ? "Tu" : `Membro`}
                        </span>
                        <Badge
                          variant={isMemberOwner ? "default" : "secondary"}
                          className="ml-2 text-[10px] px-1.5 py-0"
                        >
                          {isMemberOwner ? "Proprietario" : "Editor"}
                        </Badge>
                      </div>
                    </div>

                    {isOwner && !isCurrentUser && !isMemberOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(member.user_id)}
                        disabled={removeMutation.isPending}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
