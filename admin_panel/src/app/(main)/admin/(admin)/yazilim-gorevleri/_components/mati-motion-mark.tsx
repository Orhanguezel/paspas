import Image from 'next/image';
import styles from './mati-motion-mark.module.css';

/** Aktif360 Desk avatar used in the OSGB reference. */
export function MatiMotionMark() {
  return (
    <span className={styles.stage} aria-hidden="true">
      <span className={styles.orbit} />
      <Image className={styles.character} src="/internal/page-feedback/aktif360-avatar.png" alt="" width={512} height={512} sizes="96px" priority />
    </span>
  );
}
