import { ShieldCheck } from "lucide-react";
import { cn } from "../lib/ui";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid h-12 w-12 place-items-center overflow-hidden rounded-[18px] bg-arkane-panelHigh shadow-glow ring-1 ring-arkane-line",
        className
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-x-2 top-2 h-px bg-arkane-amber/45" />
      <span className="absolute inset-y-2 left-2 w-px bg-arkane-green/35" />
      <ShieldCheck className="relative h-6 w-6 text-arkane-amber" strokeWidth={1.8} />
    </div>
  );
}
