import { useState } from "react";
import { Archive, ArrowRight, Pencil, Trash2, Users, Share2, LogOut } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InviteDialog } from "@/components/sharing/InviteDialog";
import { MembersSheet } from "@/components/sharing/MembersSheet";
import { LeaveDialog } from "@/components/sharing/LeaveDialog";
import type { CabinetWithRole } from "@/types/cabinet";

interface CabinetDetailDrawerProps {
  cabinet: CabinetWithRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CabinetDetailDrawer({
  cabinet,
  open,
  onOpenChange,
  onNavigate,
  onEdit,
  onDelete,
}: CabinetDetailDrawerProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  if (!cabinet) return null;

  const isOwner = cabinet.role === "owner";

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent">
                <Archive className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <DrawerTitle>{cabinet.name}</DrawerTitle>
                <DrawerDescription className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={isOwner ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {isOwner ? "Proprietario" : "Editor"}
                  </Badge>
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => {
                      onOpenChange(false);
                      setMembersOpen(true);
                    }}
                  >
                    <Users className="h-3 w-3" />
                    {cabinet.member_count}{" "}
                    {cabinet.member_count === 1 ? "membro" : "membri"}
                  </button>
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <DrawerFooter>
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                onNavigate();
              }}
            >
              <ArrowRight className="h-4 w-4" />
              Vai all'armadietto
            </Button>

            {isOwner && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  setInviteOpen(true);
                }}
              >
                <Share2 className="h-4 w-4" />
                Condividi
              </Button>
            )}

            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Modifica
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </Button>
              </div>
            )}

            {!isOwner && (
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  onOpenChange(false);
                  setLeaveOpen(true);
                }}
              >
                <LogOut className="h-4 w-4" />
                Lascia armadietto
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {inviteOpen && (
        <InviteDialog
          cabinetId={cabinet.id}
          cabinetName={cabinet.name}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />
      )}

      {membersOpen && (
        <MembersSheet
          cabinetId={cabinet.id}
          cabinetName={cabinet.name}
          isOwner={isOwner}
          open={membersOpen}
          onOpenChange={setMembersOpen}
        />
      )}

      {leaveOpen && (
        <LeaveDialog
          cabinetId={cabinet.id}
          cabinetName={cabinet.name}
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
        />
      )}
    </>
  );
}
