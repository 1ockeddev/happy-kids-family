import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const FaceHappy = ({
  size = 22,
  color = '#10b981',
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
    aria-label="ดีมาก"
  >
    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth={strokeWidth} />
    <path d="M28 38 Q34 28 40 38" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M60 38 Q66 28 72 38" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M28 58 Q50 82 72 58" stroke={color} strokeWidth="5" strokeLinecap="round" />
  </svg>
);
