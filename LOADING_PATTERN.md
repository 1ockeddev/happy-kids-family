# Standard Loading Flow Pattern

This document describes the four-stage loading flow pattern used throughout the Happy Kids Family application to provide consistent, user-friendly loading states.

## Overview

The loading flow prevents flickering "no data" messages and provides clear visual feedback during data fetching with four distinct stages:

1. **Initial Loading** → Shows loading indicator
2. **Empty State** → Shows "ไม่มีข้อมูล" message (if no data exists)
3. **Shimmer Animation** → Shows skeleton placeholder (if data exists)
4. **Actual Content** → Shows real data

## Components

### Core Components

- **`LoadingWrapper`** - Main wrapper component that handles all four stages
- **`LoadingIndicator`** - Default spinning loading indicator
- **`EmptyState`** - Default empty state message

### Skeleton Components

- **`BehaviorCardSkeleton`** - For behavior summary pages
- **`FoodSummarySkeleton`** - For food/milk summary pages
- **`NapSummarySkeleton`** - For nap summary pages
- **`ExcretionSummarySkeleton`** - For excretion summary pages

All components are located in `/components/loading/`.

## Usage

### 1. Import Required Components

```tsx
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import FoodSummarySkeleton from '@/components/loading/skeletons/FoodSummarySkeleton';
```

### 2. Add Loading State Management

```tsx
const [dataLoading, setDataLoading] = useState(false);
const [showShimmer, setShowShimmer] = useState(false);
const [data, setData] = useState<YourDataType[]>([]);
```

### 3. Update Data Fetching Logic

```tsx
useEffect(() => {
  if (!requiredParams) return;
  
  let cancelled = false;
  setDataLoading(true);
  
  fetch('/api/your-endpoint')
    .then(r => r.json())
    .then(j => {
      if (!cancelled) {
        const fetchedData = j.data || [];
        setData(fetchedData);
        
        // Show shimmer briefly if has data
        if (fetchedData.length > 0) {
          setShowShimmer(true);
          setTimeout(() => setShowShimmer(false), 300);
        }
      }
    })
    .finally(() => {
      if (!cancelled) setDataLoading(false);
    });
  
  return () => { cancelled = true; };
}, [dependencies]);
```

### 4. Wrap Content with LoadingWrapper

```tsx
<LoadingWrapper
  isLoading={dataLoading}
  hasData={data.length > 0}
  showShimmer={showShimmer}
  showEmptyState={!!childId && !!enrollmentPeriod} // Wait for both
  shimmerComponent={<FoodSummarySkeleton />}
>
  {/* Your actual content here */}
  <div>
    {data.map(item => (
      <div key={item.id}>{item.name}</div>
    ))}
  </div>
</LoadingWrapper>
```

### Advanced: Conditional Empty State

Use `showEmptyState` prop to control when the empty state should appear. This is useful when you want to wait for prerequisite data before showing "no data" message:

```tsx
<LoadingWrapper
  isLoading={dataLoading}
  hasData={data.length > 0}
  showShimmer={showShimmer}
  showEmptyState={!!childId && !!prerequisiteData} // Wait for both
  shimmerComponent={<FoodSummarySkeleton />}
>
  {/* Content */}
</LoadingWrapper>
```

**Common pattern:** Wait for both user selection (childId) and prerequisite data (enrollmentPeriod) before showing empty state. This prevents showing "no data" when the user hasn't selected a child yet.

If `showEmptyState={false}` and `hasData={false}`, the component will render nothing (`null`) instead of the empty state.

## Complete Example

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import FoodSummarySkeleton from '@/components/loading/skeletons/FoodSummarySkeleton';

export default function MyPage() {
  const [dataLoading, setDataLoading] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    
    fetch('/api/items')
      .then(r => r.json())
      .then(j => {
        if (!cancelled) {
          const fetchedItems = j.data || [];
          setItems(fetchedItems);
          
          if (fetchedItems.length > 0) {
            setShowShimmer(true);
            setTimeout(() => setShowShimmer(false), 300);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <LoadingWrapper
        isLoading={dataLoading}
        hasData={items.length > 0}
        showShimmer={showShimmer}
        showEmptyState={!!childId && !!enrollmentPeriod} // Wait for both
        shimmerComponent={<FoodSummarySkeleton />}
      >
        <div>
          {items.map(item => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
      </LoadingWrapper>
    </div>
  );
}
```

## Creating Custom Skeleton Components

When creating a new page with unique layout, create a matching skeleton component:

```tsx
// components/loading/skeletons/YourCustomSkeleton.tsx
import React from 'react';

export default function YourCustomSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ background: 'white', padding: 16, borderRadius: 16 }}>
          {/* Use .shimmer class for animated placeholders */}
          <div className="shimmer" style={{ width: 120, height: 18, marginBottom: 12 }} />
          <div className="shimmer" style={{ width: '100%', height: 40 }} />
        </div>
      ))}
    </div>
  );
}
```

The `.shimmer` class is defined in `globals.css` and provides the shimmer animation effect.

## Best Practices

1. **Always use `cancelled` flag** in useEffect cleanup to prevent state updates on unmounted components
2. **Set shimmer duration to 200-300ms** - long enough to be noticeable but short enough to feel instant
3. **Match skeleton dimensions** to actual content for smooth transitions
4. **Show shimmer only when data exists** - empty state should appear immediately without shimmer
5. **Use appropriate skeleton component** for each page type
6. **Keep skeletons simple** - focus on major layout elements, not every detail
7. **Use `showEmptyState` wisely** - set to `!!childId && !!prerequisiteData` to ensure both user selection and data prerequisites are ready before showing empty state

## Pages Currently Using This Pattern

- ✅ `/app/page.tsx` (main dashboard) - Implemented with behavior summary
- ✅ `/app/summary-behavior/page.tsx`
- ✅ `/app/summary-food-milk/page.tsx`
- ✅ `/app/summary-nap/page.tsx`
- ✅ `/app/summary-excretion/page.tsx`

## Troubleshooting

### "ไม่มีข้อมูล" flashes before data loads
- Make sure `dataLoading` is set to `true` before fetch starts
- Verify `isLoading` prop is passed correctly to LoadingWrapper

### Empty state shows immediately on page load (before child is selected)
- Use `showEmptyState={!!childId && !!prerequisiteData}` to wait for both user selection and prerequisite data
- Example: `showEmptyState={!!childId && !!enrollmentPeriod}` ensures child is selected AND enrollment period is loaded
- This prevents showing "no data" when you haven't selected a child or haven't loaded the necessary context yet

### Shimmer doesn't appear
- Check that `showShimmer` is set to `true` after data is fetched
- Ensure `shimmerComponent` prop is provided
- Verify `hasData` evaluates to `true`

### Content appears immediately without any loading state
- Confirm `dataLoading` state is initialized as `false` (not `true`)
- Check that data fetch is setting `dataLoading` correctly
- Verify useEffect dependencies are correct

## CSS Classes

The shimmer animation is defined in `globals.css`:

```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
  border-radius: 8px;
}
```

## Related Documentation

- See `.kiro/specs/loading-flow-standard/` for full specification
- Component source code in `/components/loading/`
