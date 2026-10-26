import Image from 'next/image';
import styles from './mati-motion-mark.module.css';

/** Uses the idle/hello motion from the supplied promats-mati-animasyon.html. */
export function MatiMotionMark() {
  return (
    <span className={styles.stage} aria-hidden="true">
      <span className={styles.orbit} />
      <Image className={styles.character} src="/brand/mati-mascot.png" alt="" width={1104} height={1347} sizes="96px" priority />
    </span>
  );
}
