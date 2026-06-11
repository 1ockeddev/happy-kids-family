import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const CheckCircle = ({
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
    aria-label="ถูกต้อง"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12.5l2.5 2.5L16 9" />
  </svg>
);
