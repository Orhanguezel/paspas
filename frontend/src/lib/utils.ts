// Convenience re-export so '@/lib/utils' resolves locally.
// Asıl implementasyon shared-ui'de — DRY.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
