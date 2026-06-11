import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const Building = ({
  size = 48,
  color = '#6366f1',
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
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label="โรงเรียน"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M8 10h.01" />
    <path d="M16 10h.01" />
    <path d="M8 14h.01" />
    <path d="M16 14h.01" />
    <path d="M12 14h.01" />
  </svg>
);
