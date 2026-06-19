import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MilkStatus } from '@/types';
import { amountLabels, amountStyles, shimmerStyle } from './constants';

/* ── Avatar ─────────────────────────────────*/
interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  active?: boolean;
  accentColor?: string;
}

export function Avatar({ src, name, size = 42, active, accentColor = '#6366f1' }: AvatarProps) {
  const initial = (name ?? '?').slice(0, 1).toUpperCase();
  const colors = ['#E8754A', '#6366f1', '#4A90B8', '#4CAF76', '#F5A623', '#E85C5C', '#ec4899', '#34d399'];
  const bg = colors[initial.charCodeAt(0) % colors.length];

  return src ? (
    <img
      src={src}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: `2px solid ${active ? accentColor : '#e2e8f0'}`,
        opacity: active ? 1 : 0.35,
        transition: 'all .2s',
        flexShrink: 0
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: active ? bg : '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'white' : '#94a3b8',
        fontSize: size * 0.4,
        fontWeight: 700,
        border: `2px solid ${active ? accentColor : '#e2e8f0'}`,
        opacity: active ? 1 : 0.35,
        transition: 'all .2s',
        flexShrink: 0
      }}
    >
      {initial}
    </div>
  );
}

/* ── Custom Tooltip ─────────────────────────────────*/
interface CustomTooltipProps {
  children: React.ReactNode;
  text: string | React.ReactNode;
}

export function CustomTooltip({ children, text }: CustomTooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, align: 'center' });
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Check if we're in the browser
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top - 8;

    // Check if tooltip will overflow screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 200; // max-width of tooltip
    const tooltipHeight = 60; // estimated height
    const padding = 16; // padding from screen edges

    let align = 'center';
    let x = centerX;
    let y = topY;

    // Check if tooltip will overflow top of screen
    if (topY - tooltipHeight < padding) {
      // Not enough space above, position below instead
      y = rect.bottom + 8;
    }

    // If too close to right edge, align right
    if (centerX + tooltipWidth / 2 > viewportWidth - padding) {
      align = 'right';
      x = Math.min(rect.right, viewportWidth - padding);
    }
    // If too close to left edge, align left
    else if (centerX - tooltipWidth / 2 < padding) {
      align = 'left';
      x = Math.max(rect.left, padding);
    }

    setPos({ x, y: topY, align });
    setShow(true);
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  const getTransform = () => {
    if (pos.align === 'left') return 'translate(0, -100%)';
    if (pos.align === 'right') return 'translate(-100%, -100%)';
    return 'translate(-50%, -100%)';
  };

  const getArrowStyle = () => {
    if (pos.align === 'left') return { left: 5 };
    if (pos.align === 'right') return { right: 5 };
    return { left: '50%', transform: 'translateX(-50%)' };
  };

  // Render tooltip in a portal to body to avoid overflow clipping
  const tooltipPortal =
    isMounted && show && typeof document !== 'undefined'
      ? ReactDOM.createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              left: pos.x,
              top: pos.y,
              transform: getTransform(),
              background: 'rgba(15, 23, 42, 0.95)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: '0.7rem',
              fontWeight: 500,
              whiteSpace: 'pre-line',
              pointerEvents: 'none',
              zIndex: 99999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              maxWidth: 'min(200px, calc(100vw - 32px))',
              textAlign: 'center',
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}
          >
            {text}
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                ...getArrowStyle(),
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid rgba(15, 23, 42, 0.95)'
              }}
            />
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ position: 'relative' }}>
        {children}
      </div>
      {tooltipPortal}
    </>
  );
}

/* ── StatusPill ─────────────────────────────*/
interface PillProps {
  status: MilkStatus;
}

export function Pill({ status }: PillProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: '0.65rem',
        fontWeight: 700,
        alignSelf: 'flex-start',
        ...amountStyles[status]
      }}
    >
      {amountLabels[status]}
    </span>
  );
}

/* ── Skeleton Components ──────────────────────────────── */
interface SkRowProps {
  w?: string | number;
  h?: number;
  mb?: number;
}

export function SkRow({ w = '100%', h = 14, mb = 0 }: SkRowProps) {
  return <div style={{ ...shimmerStyle, width: w, height: h, marginBottom: mb }} />;
}

interface SkCircleProps {
  size?: number;
}

export function SkCircle({ size = 40 }: SkCircleProps) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0
      }}
    />
  );
}
