# Design: Standard Loading Flow Pattern

## Architecture Overview

### Component Structure
```
LoadingWrapper (new component)
├── Initial Loading Indicator
├── Empty State Message
├── Shimmer Skeleton
└── Actual Content
```

### State Flow Diagram
```
Page Mount
    ↓
[isLoading: true, hasData: false] → Show Loading Indicator
    ↓
Fetch Data
    ↓
Data Response?
    ├─ No Data → [isLoading: false, hasData: false] → Show Empty State
    └─ Has Data → [isLoading: false, hasData: true, showShimmer: true]
                        ↓
                   Show Shimmer Animation
                        ↓
                   Data Prepared
                        ↓
                   [showShimmer: false] → Show Actual Content
```

## Design Decisions

### Decision 1: Reusable Loading Wrapper Component
**Choice:** Create a generic `LoadingWrapper` component that handles all four stages

**Rationale:**
- DRY principle - avoid duplicating loading logic across pages
- Consistent behavior across the app
- Easier to maintain and update

**Alternative Considered:** Implement loading logic separately on each page
- Rejected because it leads to inconsistencies and duplication

### Decision 2: Separate Shimmer from Loading Indicator
**Choice:** Use two distinct loading states:
- `isLoading`: Initial data fetching
- `showShimmer`: Data preparation/layout phase

**Rationale:**
- Clear separation of concerns
- Loading indicator for unknown wait time
- Shimmer for known layout structure (data exists)
- Better user perception of progress

### Decision 3: Page-Specific Shimmer Components
**Choice:** Create custom shimmer components for each content type

**Rationale:**
- Each page has different layouts
- Shimmer should match the actual content structure
- Provides better visual continuity

**Components to create:**
- `BehaviorCardSkeleton`
- `FoodSummarySkeleton`
- `NapSummarySkeleton`
- `ExcretionSummarySkeleton`

## Technical Specifications

### Loading State Types

```typescript
interface LoadingState {
  isLoading: boolean;      // Initial fetch in progress
  hasData: boolean;        // Whether data exists
  showShimmer: boolean;    // Whether to show shimmer animation
  error?: string;          // Error message if fetch failed
}
```

### LoadingWrapper Component API

```typescript
interface LoadingWrapperProps {
  isLoading: boolean;
  hasData: boolean;
  showShimmer?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  shimmerComponent?: React.ReactNode;
  children: React.ReactNode;
}
```

### Usage Example

```typescript
const [loadingState, setLoadingState] = useState<LoadingState>({
  isLoading: true,
  hasData: false,
  showShimmer: false
});

// Fetch data
useEffect(() => {
  fetchData().then(data => {
    if (data.length === 0) {
      setLoadingState({ isLoading: false, hasData: false, showShimmer: false });
    } else {
      setLoadingState({ isLoading: false, hasData: true, showShimmer: true });
      // Process data, then:
      setTimeout(() => {
        setLoadingState(prev => ({ ...prev, showShimmer: false }));
      }, 300); // Brief shimmer duration
    }
  });
}, []);

return (
  <LoadingWrapper
    isLoading={loadingState.isLoading}
    hasData={loadingState.hasData}
    showShimmer={loadingState.showShimmer}
    shimmerComponent={<BehaviorCardSkeleton />}
  >
    {/* Actual content */}
  </LoadingWrapper>
);
```

## Implementation Strategy

### Phase 1: Create Core Components
1. Create `LoadingWrapper` component
2. Create default loading indicator component
3. Create default empty state component

### Phase 2: Create Page-Specific Shimmer Components
1. Analyze each page's layout
2. Create matching skeleton components
3. Ensure proper dimensions and spacing

### Phase 3: Update Existing Pages
1. Start with pages that don't have loading states
2. Refactor `summary-food-milk` to use new components
3. Apply to all remaining pages
4. Test each page thoroughly

### Phase 4: Documentation and Cleanup
1. Document the pattern in project README
2. Create usage guide for future pages
3. Remove any old loading patterns

## Component Details

### LoadingWrapper Component Location
**Path:** `/components/loading/LoadingWrapper.tsx`

**Features:**
- Handles conditional rendering based on state
- Provides default components for each stage
- Allows custom components via props
- Minimal styling (uses Tailwind)

### Shimmer Skeleton Components Location
**Path:** `/components/loading/skeletons/`
- `BehaviorCardSkeleton.tsx`
- `FoodSummarySkeleton.tsx`
- `NapSummarySkeleton.tsx`
- `ExcretionSummarySkeleton.tsx`

**Features:**
- Match actual component dimensions
- Use shimmer animation CSS
- Tailwind for styling consistency

### Default Components
1. **LoadingIndicator** - Spinning icon or pulse animation
2. **EmptyState** - "ไม่มีข้อมูล" with optional icon

## Styling Guidelines

### Shimmer Animation
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
}
```

### Consistent Colors
- Shimmer background: `#f0f0f0`
- Shimmer highlight: `#e0e0e0`
- Empty state text: `#6b7280` (gray-500)

## Testing Considerations

### Test Scenarios
1. **Fast Connection**: Verify shimmer appears briefly
2. **Slow Connection**: Verify loading indicator shows appropriately
3. **No Data**: Verify empty state appears without shimmer
4. **Error State**: Verify error handling (future enhancement)

### Edge Cases
- Multiple rapid page changes
- Data updates while shimmer is showing
- Component unmount during fetch

## Performance Considerations

### Optimization Strategies
1. Use CSS animations (hardware accelerated) instead of JavaScript
2. Lazy load shimmer components only when needed
3. Minimize shimmer duration (200-500ms typically)
4. Avoid unnecessary re-renders with proper state management

## Accessibility

### ARIA Labels
- Loading indicator: `aria-label="กำลังโหลดข้อมูล"`
- Empty state: `aria-label="ไม่มีข้อมูล"`
- Shimmer: `aria-hidden="true"` (decorative)

### Screen Reader Announcements
- Announce when loading starts
- Announce when data is ready
- Announce when no data is available

## Migration Plan

### Pages Priority Order
1. `/app/page.tsx` (main dashboard - high visibility)
2. `/app/summary-nap/page.tsx` (needs loading state)
3. `/app/summary-excretion/page.tsx` (needs loading state)
4. `/app/summary-behavior/page.tsx` (needs loading state update)
5. `/app/summary-food-milk/page.tsx` (refactor to use new components)
6. `/app/report/page.tsx` (if applicable)

### Rollback Strategy
- Keep old implementation in git history
- Test each page individually before moving to next
- Monitor for any user-reported issues

## Future Enhancements
- Add error state handling
- Implement retry mechanisms
- Add loading progress indicators for long operations
- Create storybook documentation for loading components
