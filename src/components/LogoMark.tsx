import { cn } from "../lib/ui";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid h-12 w-12 place-items-center overflow-hidden rounded-[18px] bg-[#0d140f] shadow-glow ring-1 ring-arkane-line",
        className
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-x-2 top-2 h-px bg-arkane-amber/45" />
      <span className="absolute inset-y-2 left-2 w-px bg-arkane-green/35" />
      <svg viewBox="0 0 64 64" className="relative h-8 w-8" fill="none">
        <path
          d="M32 7.5 50 15.2v14.1c0 13.2-6.7 21.8-18 27.2-11.3-5.4-18-14-18-27.2V15.2L32 7.5Z"
          fill="#132016"
          stroke="#e6b84b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M32 14.5 43 19.2v10.2c0 8.5-4.1 14.4-11 18-6.9-3.6-11-9.5-11-18V19.2l11-4.7Z"
          fill="#17261b"
          stroke="#63d99a"
          strokeWidth="1.8"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path d="M24.2 33.2 30 39l11-15.2" stroke="#eff5d8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 49h18" stroke="#e6b84b" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  );
}
