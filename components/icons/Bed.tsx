import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const Bed = ({
  size = 28,
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
    aria-label="นอน"
  >
    <path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
    <path d="M3 12V6a2 2 0 0 1 2-2h3" />
    <circle cx="7" cy="10" r="1.5" />
  </svg>
);
