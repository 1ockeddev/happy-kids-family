import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const Camera = ({
  size = 20,
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
    aria-label="กล้อง"
  >
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <circle cx="12" cy="13" r="3" />
    <path d="M7 6l1-2h8l1 2" />
  </svg>
);
