'use client';

import React from 'react';
import Image from 'next/image';

interface CategoryIconProps {
  icon?: string | null;
  name?: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  name = 'Kategori',
  className = 'w-6 h-6 object-contain',
  size = 24,
}) => {
  if (!icon) return <span className="leading-none">📦</span>;

  const isImagePath =
    icon.startsWith('/') ||
    icon.startsWith('http') ||
    icon.endsWith('.png') ||
    icon.endsWith('.svg') ||
    icon.includes('.png');

  if (isImagePath) {
    return (
      <Image
        src={icon}
        alt={name}
        width={size}
        height={size}
        className={className}
        unoptimized
      />
    );
  }

  return <span className="leading-none">{icon}</span>;
};
