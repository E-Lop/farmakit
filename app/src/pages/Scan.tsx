import { ScanLine } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";

export function Scan() {
  return (
    <>
      <Header title="Scansiona" />
      <PageLayout>
        <div className="flex flex-col items-center justify-center px-6 pt-20 text-center animate-fade-in">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-accent">
            <ScanLine className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Scanner barcode</h2>
          <p className="max-w-[260px] text-sm leading-relaxed text-muted-foreground">
            Lo scanner barcode sarà disponibile nella prossima versione.
          </p>
        </div>
      </PageLayout>
    </>
  );
}
