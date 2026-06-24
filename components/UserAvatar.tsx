'use client';
import { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  fontSize?: number;
}

export default function UserAvatar({ 
  src, 
  name, 
  size = 40, 
  fontSize 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Generate initials from name
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    
    // Remove special characters and get first character
    const cleaned = name.trim();
    
    // Try to get Thai or English first character
    const firstChar = cleaned.charAt(0).toUpperCase();
    
    // If it's a Thai character, return it
    if (/[\u0E00-\u0E7F]/.test(firstChar)) {
      return firstChar;
    }
    
    // If it's English, try to get initials from first and last name
    const words = cleaned.split(/\s+/);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    
    return firstChar;
  };

  // Generate color from name (consistent color for same name)
  const getColorFromName = (name?: string | null) => {
    if (!name) return '#6B7280'; // gray-500
    
    // Hash the name to get a number
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Array of pleasant colors
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
      '#6366F1', // indigo-500
      '#06B6D4', // cyan-500
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const actualFontSize = fontSize || size * 0.4;

  // Show avatar with initials if no image or image failed
  const showInitials = !src || imageError;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: showInitials ? bgColor : '#E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: actualFontSize,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        userSelect: 'none'
      }}
    >
      {src && !imageError && (
        <>
          <img
            src={src}
            alt={name || 'User'}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={() => setImageLoading(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: imageLoading ? 0 : 1,
              transition: 'opacity 0.2s'
            }}
          />
          {imageLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: actualFontSize
            }}>
              {initials}
            </div>
          )}
        </>
      )}
      {showInitials && initials}
    </div>
  );
}
