import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <main className={cn("mx-auto max-w-lg px-4 pb-20 pt-4", className)}>
      {children}
    </main>
  );
}
