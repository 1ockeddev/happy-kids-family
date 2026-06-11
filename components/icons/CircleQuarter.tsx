import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const CircleQuarter = ({
  size = 18,
  color = 'currentColor',
  className = '',
  strokeWidth = 2
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    role="img"
    aria-label="นิดหน่อย"
  >
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeWidth} />
    <path d="M12 12 L12 4 A 8 8 0 0 1 20 12 Z" fill={color} />
  </svg>
);
