import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const Toilet = ({
  size = 24,
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
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label="โถส้วม"
  >
    <rect x="6" y="10" width="12" height="10" rx="2" />
    <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);
