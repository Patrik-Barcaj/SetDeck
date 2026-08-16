interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 28 }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={className}
      aria-label="SetDrift logo"
    >
      <rect width="160" height="160" rx="32" fill="#0D0E12" />
      {/* Track 1 (Top) */}
      <rect x="36" y="42" width="54" height="16" rx="8" fill="#D97706" />
      {/* Track 2 (Middle - Offset / Drift) */}
      <rect x="52" y="72" width="72" height="16" rx="8" fill="#F59E0B" />
      {/* Track 3 (Bottom) */}
      <rect x="36" y="102" width="54" height="16" rx="8" fill="#FBBF24" />
    </svg>
  );
}
