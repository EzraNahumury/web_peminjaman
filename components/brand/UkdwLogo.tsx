import Image from 'next/image';
import { cn } from '@/lib/cn';

export const UKDW_LOGO_SRC = '/ukdw-logo-white.png';

type Props = {
  className?: string;
  /** Lebar tampilan (tinggi mengikuti proporsi aspek logo) */
  width?: number;
  height?: number;
  priority?: boolean;
};

export function UkdwLogo({ className, width = 40, height = 40, priority }: Props) {
  return (
    <Image
      src={UKDW_LOGO_SRC}
      alt="Universitas Duta Wacana Kristen"
      width={width}
      height={height}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}
