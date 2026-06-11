import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const Diaper = ({
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
    aria-label="ผ้าอ้อม"
  >
    <path d="M4 8c0-2 1-3 3-3h10c2 0 3 1 3 3v4c0 4-2 7-8 7s-8-3-8-7V8z" />
    <path d="M8 12h8" />
  </svg>
);
