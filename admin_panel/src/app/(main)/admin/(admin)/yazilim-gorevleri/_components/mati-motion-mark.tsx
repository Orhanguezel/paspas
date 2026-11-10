import Image from 'next/image';
import { cn } from '@/lib/utils';
import styles from './mati-motion-mark.module.css';

/** Paspas Mati mascot with its idle and greeting motions. */
export function MatiMotionMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn(styles.stage, compact && styles.compact)} aria-hidden="true">
      <span className={styles.orbit} />
      <Image className={styles.character} src="/brand/mati-mascot.png" alt="" width={1104} height={1347} sizes="96px" priority />
    </span>
  );
}
