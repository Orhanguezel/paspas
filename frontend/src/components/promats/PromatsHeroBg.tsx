import type { ReactNode } from 'react';

import PromatsImage from './PromatsImage';

type Props = {
  src: string | null | undefined;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  className?: string;
  children?: ReactNode;
};

export default function PromatsHeroBg({
  src,
  priority = false,
  loading,
  className = 'untree_co--site-hero overlay',
  children,
}: Props) {
  return (
    <div className={`${className} promats-hero-with-bg`}>
      {src ? (
        <PromatsImage
          src={src}
          alt=""
          fill
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={loading}
          sizes="100vw"
          className="promats-hero-bg"
        />
      ) : null}
      {children}
    </div>
  );
}
