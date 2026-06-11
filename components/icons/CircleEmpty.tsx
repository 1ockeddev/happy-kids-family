import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const CircleEmpty = ({
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
    stroke={color}
    strokeWidth={strokeWidth}
    className={className}
    role="img"
    aria-label="ข้าม"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
);
