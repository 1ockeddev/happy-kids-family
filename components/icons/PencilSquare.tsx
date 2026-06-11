import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const PencilSquare = ({
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
    aria-label="แก้ไข"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 17l3.5-3.5" />
    <path d="M14.5 7L17 9.5" />
    <path d="M10.5 13.5l4-4" />
  </svg>
);
