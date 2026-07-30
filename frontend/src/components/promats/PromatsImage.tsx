'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';

import { assetPath } from '@/lib/promats/api';

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  loading?: 'lazy' | 'eager';
  sizes?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  style?: CSSProperties;
  assetBase?: '/assets' | '/userfiles';
};

const FLUID_SIZES = '(max-width: 768px) 100vw, 50vw';
const FLUID_WIDTH = 960;
const FLUID_HEIGHT = 720;

function resolvePath(src: string | null | undefined, assetBase?: '/assets' | '/userfiles'): string {
  if (!src) return '';
  if (src.startsWith('/assets')) return assetPath(src, '/assets');
  if (src.startsWith('/userfiles')) return src;
  return assetPath(src, assetBase ?? '/userfiles');
}

export default function PromatsImage({
  src,
  alt = '',
  className,
  priority = false,
  fetchPriority,
  loading,
  sizes = FLUID_SIZES,
  width,
  height,
  fill = false,
  style,
  assetBase,
}: Props) {
  const path = resolvePath(src, assetBase);
  if (!path) return null;

  const lazyProps = priority
    ? { priority: true as const }
    : { loading: loading ?? ('lazy' as const) };

  if (fill) {
    return (
      <Image
        src={path}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        style={style}
        fetchPriority={fetchPriority}
        {...lazyProps}
      />
    );
  }

  const fluid = width === undefined && height === undefined;

  return (
    <Image
      src={path}
      alt={alt}
      width={width ?? FLUID_WIDTH}
      height={height ?? FLUID_HEIGHT}
      sizes={sizes}
      className={className}
      fetchPriority={fetchPriority}
      style={fluid ? { width: '100%', height: 'auto', ...style } : style}
      {...lazyProps}
    />
  );
}
