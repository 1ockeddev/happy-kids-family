# Tasks: Standard Loading Flow Pattern

## Task 1: Create LoadingWrapper Component
**Status:** completed
**Priority:** high
**Dependencies:** none

### Description
Create a reusable `LoadingWrapper` component that handles all four stages of the loading flow (initial loading, empty state, shimmer, and content display).

### Acceptance Criteria
- [x] Component created at `/components/loading/LoadingWrapper.tsx`
- [x] Accepts props: `isLoading`, `hasData`, `showShimmer`, `loadingComponent`, `emptyComponent`, `shimmerComponent`, `children`
- [x] Conditionally renders correct stage based on state
- [x] Provides default loading and empty state components
- [x] Uses TypeScript with proper types
- [x] Styled with Tailwind CSS

### Files to Create/Modify
- `/components/loading/LoadingWrapper.tsx` (created)

---

## Task 2: Create Default Loading Components
**Status:** completed
**Priority:** high
**Dependencies:** Task 1

### Description
Create default loading indicator and empty state components that can be used across all pages.

### Acceptance Criteria
- [x] `LoadingIndicator.tsx` created with spinning/pulse animation
- [x] `EmptyState.tsx` created with "ไม่มีข้อมูล" message
- [x] Components use consistent styling
- [x] Components are accessible (ARIA labels)
- [x] Components accept optional custom messages/icons

### Files to Create/Modify
- `/components/loading/LoadingIndicator.tsx` (created)
- `/components/loading/EmptyState.tsx` (created)

---

## Task 3: Create Shimmer CSS Animation
**Status:** completed
**Priority:** high
**Dependencies:** none

### Description
Add shimmer animation styles to global CSS that can be reused across all skeleton components.

### Acceptance Criteria
- [x] Shimmer keyframe animation added to `globals.css`
- [x] `.shimmer` utility class created
- [x] Animation is smooth and performant
- [x] Colors match design specifications (#f0f0f0, #e0e0e0)

### Files to Create/Modify
- `/app/globals.css` (modified)

---

## Task 4: Create Behavior Card Skeleton Component
**Status:** completed
**Priority:** medium
**Dependencies:** Task 3

### Description
Create a skeleton loader that matches the behavior card layout on the main dashboard.

### Acceptance Criteria
- [x] Component created at `/components/loading/skeletons/BehaviorCardSkeleton.tsx`
- [x] Matches actual behavior card dimensions and spacing
- [x] Uses shimmer animation
- [x] Includes placeholder for icon, text, and score
- [x] Responsive design

### Files to Create/Modify
- `/components/loading/skeletons/BehaviorCardSkeleton.tsx` (created)

---

## Task 5: Create Food Summary Skeleton Component
**Status:** completed
**Priority:** medium
**Dependencies:** Task 3

### Description
Create a skeleton loader that matches the food summary layout.

### Acceptance Criteria
- [x] Component created at `/components/loading/skeletons/FoodSummarySkeleton.tsx`
- [x] Matches actual food summary layout
- [x] Uses shimmer animation
- [x] Includes placeholders for all summary items
- [x] Responsive design

### Files to Create/Modify
- `/components/loading/skeletons/FoodSummarySkeleton.tsx` (created)

---

## Task 6: Create Nap Summary Skeleton Component
**Status:** completed
**Priority:** medium
**Dependencies:** Task 3

### Description
Create a skeleton loader that matches the nap summary layout.

### Acceptance Criteria
- [x] Component created at `/components/loading/skeletons/NapSummarySkeleton.tsx`
- [x] Matches actual nap summary layout
- [x] Uses shimmer animation
- [x] Includes placeholders for nap records
- [x] Responsive design

### Files to Create/Modify
- `/components/loading/skeletons/NapSummarySkeleton.tsx` (created)

---

## Task 7: Create Excretion Summary Skeleton Component
**Status:** completed
**Priority:** medium
**Dependencies:** Task 3

### Description
Create a skeleton loader that matches the excretion summary layout.

### Acceptance Criteria
- [x] Component created at `/components/loading/skeletons/ExcretionSummarySkeleton.tsx`
- [x] Matches actual excretion summary layout
- [x] Uses shimmer animation
- [x] Includes placeholders for excretion records
- [x] Responsive design

### Files to Create/Modify
- `/components/loading/skeletons/ExcretionSummarySkeleton.tsx` (created)

---

## Task 8: Update Main Dashboard Page (page.tsx)
**Status:** completed
**Priority:** high
**Dependencies:** Task 1, Task 2, Task 4

### Description
Implement the standard loading flow on the main dashboard page.

### Acceptance Criteria
- [x] Import and use `LoadingWrapper` component
- [x] Implement proper loading state management
- [x] Use `BehaviorCardSkeleton` for behavior section
- [x] Handle all four stages correctly (loading, empty, shimmer, content)
- [x] Test with fast and slow connections
- [x] No flickering "no data" messages

### Files to Create/Modify
- `/app/page.tsx` (modified)

---

## Task 9: Update Summary Behavior Page
**Status:** completed
**Priority:** medium
**Dependencies:** Task 1, Task 2, Task 4

### Description
Implement the standard loading flow on the behavior summary page.

### Acceptance Criteria
- [x] Import and use `LoadingWrapper` component
- [x] Implement proper loading state management
- [x] Use `BehaviorCardSkeleton` for content
- [x] Handle all four stages correctly
- [x] Test with fast and slow connections
- [x] No flickering "no data" messages

### Files to Create/Modify
- `/app/summary-behavior/page.tsx` (modified)

---

## Task 10: Update Summary Food-Milk Page
**Status:** completed
**Priority:** medium
**Dependencies:** Task 1, Task 2, Task 5

### Description
Refactor the existing loading state implementation to use the new standard components.

### Acceptance Criteria
- [x] Refactor to use `LoadingWrapper` component
- [x] Replace custom loading logic with standard pattern
- [x] Use `FoodSummarySkeleton` for content
- [x] Maintain existing functionality
- [x] Code is cleaner and more maintainable

### Files to Create/Modify
- `/app/summary-food-milk/page.tsx` (modified)

---

## Task 11: Update Summary Nap Page
**Status:** completed
**Priority:** medium
**Dependencies:** Task 1, Task 2, Task 6

### Description
Implement the standard loading flow on the nap summary page.

### Acceptance Criteria
- [x] Import and use `LoadingWrapper` component
- [x] Implement proper loading state management
- [x] Use `NapSummarySkeleton` for content
- [x] Handle all four stages correctly
- [x] Test with fast and slow connections
- [x] No flickering "no data" messages

### Files to Create/Modify
- `/app/summary-nap/page.tsx` (modified)

---

## Task 12: Update Summary Excretion Page
**Status:** completed
**Priority:** medium
**Dependencies:** Task 1, Task 2, Task 7

### Description
Implement the standard loading flow on the excretion summary page.

### Acceptance Criteria
- [x] Import and use `LoadingWrapper` component
- [x] Implement proper loading state management
- [x] Use `ExcretionSummarySkeleton` for content
- [x] Handle all four stages correctly
- [x] Test with fast and slow connections
- [x] No flickering "no data" messages

### Files to Create/Modify
- `/app/summary-excretion/page.tsx` (modified)

---

## Task 13: Update Report Page (if applicable)
**Status:** pending
**Priority:** low
**Dependencies:** Task 1, Task 2

### Description
Review and implement the standard loading flow on the report page if it fetches data.

### Acceptance Criteria
- [ ] Analyze if page needs loading state
- [ ] If yes, implement `LoadingWrapper` component
- [ ] Create custom skeleton if needed
- [ ] Handle all four stages correctly
- [ ] Test with fast and slow connections

### Files to Create/Modify
- `/app/report/page.tsx` (modify, if needed)

---

## Task 14: Create Documentation
**Status:** completed
**Priority:** medium
**Dependencies:** All previous tasks

### Description
Document the loading flow pattern for future developers.

### Acceptance Criteria
- [x] Create `LOADING_PATTERN.md` in project root
- [x] Explain the four-stage loading flow
- [x] Provide usage examples
- [x] Include code snippets
- [x] Document best practices
- [x] Add troubleshooting guide

### Files to Create/Modify
- `/LOADING_PATTERN.md` (created)

---

## Task 15: Testing and Quality Assurance
**Status:** pending
**Priority:** high
**Dependencies:** Tasks 8-13

### Description
Comprehensive testing of the loading flow pattern across all updated pages.

### Acceptance Criteria
- [ ] Test each page with fast connection (no visible loading)
- [ ] Test each page with throttled connection (3G simulation)
- [ ] Verify no "no data" flickering on any page
- [ ] Test empty state scenarios
- [ ] Verify shimmer appears and transitions smoothly
- [ ] Check responsive behavior on mobile
- [ ] Verify accessibility with screen reader
- [ ] Test page navigation during loading

### Files to Create/Modify
- None (testing task)

---

## Summary

### Total Tasks: 15
- High Priority: 5
- Medium Priority: 9
- Low Priority: 1

### Estimated Timeline
- Phase 1 (Core Components): Tasks 1-3 → 1-2 days
- Phase 2 (Skeleton Components): Tasks 4-7 → 1-2 days
- Phase 3 (Page Updates): Tasks 8-13 → 2-3 days
- Phase 4 (Documentation & Testing): Tasks 14-15 → 1 day

**Total Estimated Time:** 5-8 days

### Task Dependencies Graph
```
Task 1 (LoadingWrapper)
  ├─→ Task 2 (Default Components)
  │    └─→ Task 8, 9, 10, 11, 12, 13
  └─→ Task 8, 9, 10, 11, 12, 13

Task 3 (Shimmer CSS)
  ├─→ Task 4 (Behavior Skeleton)
  │    └─→ Task 8, 9
  ├─→ Task 5 (Food Skeleton)
  │    └─→ Task 10
  ├─→ Task 6 (Nap Skeleton)
  │    └─→ Task 11
  └─→ Task 7 (Excretion Skeleton)
       └─→ Task 12

Tasks 8-13 (All Page Updates)
  └─→ Task 14 (Documentation)
       └─→ Task 15 (Testing)
```

### Recommended Execution Order
1. Tasks 1-3 (parallel)
2. Tasks 4-7 (parallel after Task 3)
3. Task 8 (main dashboard first - high visibility)
4. Tasks 9-12 (can be done in parallel)
5. Task 13 (review and implement if needed)
6. Task 14 (documentation)
7. Task 15 (final testing)
