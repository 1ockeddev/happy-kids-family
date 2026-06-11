import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const CircleFull = ({
  size = 18,
  color = 'currentColor',
  className = ''
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    role="img"
    aria-label="ทานหมด"
  >
    <circle cx="12" cy="12" r="8" fill={color} />
  </svg>
);
