// src/modules/_shared/flags.ts

import type { BooleanLike } from './validation';

// toBool now lives in _shared.ts (more robust implementation)
// Re-export it for backward compatibility
export { toBool } from './_shared';

export function to01(v: unknown): 0 | 1 | undefined {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
}

export type BoolLike01 = BooleanLike;
