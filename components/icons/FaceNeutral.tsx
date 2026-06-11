import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const FaceNeutral = ({
  size = 22,
  color = '#f97316',
  className = '',
  strokeWidth = 4
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="ควรปรับปรุง"
  >
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="35" cy="38" r="4" fill={color} />
    <circle cx="65" cy="38" r="4" fill={color} />
    <line x1="35" y1="62" x2="65" y2="62" stroke={color} strokeWidth="5" strokeLinecap="round" />
  </svg>
);
