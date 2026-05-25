import { ShieldCheck } from "lucide-react";
import { cn } from "../lib/ui";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid h-12 w-12 place-items-center rounded-[18px] bg-arkane-panelHigh shadow-glow ring-1 ring-arkane-line",
        className
      )}
      aria-hidden="true"
    >
      <ShieldCheck className="h-6 w-6 text-arkane-amber" strokeWidth={1.8} />
    </div>
  );
}
