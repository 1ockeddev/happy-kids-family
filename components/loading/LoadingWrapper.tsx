import React from 'react';
import LoadingIndicator from './LoadingIndicator';
import EmptyState from './EmptyState';

interface LoadingWrapperProps {
  isLoading: boolean;
  hasData: boolean;
  showShimmer?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  shimmerComponent?: React.ReactNode;
  children: React.ReactNode;
  showEmptyState?: boolean; // New prop to control when to show empty state
}

/**
 * LoadingWrapper - Four-Stage Loading Flow Component
 * 
 * Stage 1: Initial Loading (isLoading=true) → Shows loading indicator
 * Stage 2: Empty State (isLoading=false, hasData=false, showEmptyState=true) → Shows empty message
 * Stage 3: Shimmer (isLoading=false, hasData=true, showShimmer=true) → Shows skeleton
 * Stage 4: Content (isLoading=false, hasData=true, showShimmer=false) → Shows actual content
 */
export default function LoadingWrapper({
  isLoading,
  hasData,
  showShimmer = false,
  loadingComponent,
  emptyComponent,
  shimmerComponent,
  children,
  showEmptyState = true // Default to true for backward compatibility
}: LoadingWrapperProps) {
  // Stage 1: Initial Loading
  if (isLoading) {
    return <>{loadingComponent || <LoadingIndicator />}</>;
  }

  // Stage 2: Empty State (only show if explicitly enabled)
  if (!hasData && showEmptyState) {
    return <>{emptyComponent || <EmptyState />}</>;
  }

  // If no data and empty state is disabled, show nothing
  if (!hasData && !showEmptyState) {
    return null;
  }

  // Stage 3: Shimmer Animation
  if (showShimmer && shimmerComponent) {
    return <>{shimmerComponent}</>;
  }

  // Stage 4: Actual Content
  return <>{children}</>;
}
