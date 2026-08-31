import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 28 }: LogoProps) {
  return (
    <Image
      src="/saArtboard 1@0.75x.png"
      alt="SetDrift logo"
      width={size}
      height={size}
      className={`rounded-lg object-contain ${className || ''}`}
      priority
    />
  );
}
