# Requirements: Standard Loading Flow Pattern

## Overview
Establish a consistent, user-friendly loading flow pattern across all pages in the Happy Kids Family application to prevent flickering "no data" messages and provide clear feedback during data loading states.

## Background
Currently, some pages show a brief "ไม่มีข้อมูล" (no data) message while data is still being fetched, creating a confusing user experience. The app needs a standardized approach to handle loading states that works consistently across all pages.

## Goals
1. Eliminate flickering "no data" messages during initial page load
2. Provide clear visual feedback during data fetching
3. Create a consistent user experience across all pages
4. Improve perceived performance with appropriate loading animations

## User Requirements

### FR-1: Four-Stage Loading Flow
The application must implement a four-stage loading flow on all data-driven pages:

1. **Stage 1: Initial Loading**
   - Show a loading indicator when the page first loads
   - User clearly understands that data is being fetched
   
2. **Stage 2: Empty State Detection**
   - If no data exists after loading completes, show "ไม่มีข้อมูล" message
   - Skip stages 3 and 4
   
3. **Stage 3: Data Preparation (Shimmer Animation)**
   - If data exists, show shimmer/skeleton animation
   - Indicates data is being prepared for display
   - Maintains layout structure
   
4. **Stage 4: Data Display**
   - Replace shimmer with actual data
   - Smooth transition without layout shifts

### FR-2: Consistent Implementation
- All pages with data fetching must follow the same pattern
- Pages to be updated include:
  - `/app/page.tsx` (main dashboard)
  - `/app/summary-behavior/page.tsx`
  - `/app/summary-food-milk/page.tsx` (reference implementation exists)
  - `/app/summary-nap/page.tsx`
  - `/app/summary-excretion/page.tsx`
  - `/app/report/page.tsx`
  - Any other pages that fetch and display data

### FR-3: Loading State Management
- Must use `isLoading` or `dataLoading` state to track fetch status
- Must not show "no data" message while `isLoading === true`
- Must distinguish between "loading", "empty", and "has data" states

### FR-4: Visual Consistency
- Loading indicators should use consistent styling
- Shimmer animations should match the component they're replacing
- Transitions should be smooth (no jarring layout shifts)

## Non-Functional Requirements

### NFR-1: Performance
- Loading states should not degrade app performance
- Shimmer animations should be lightweight

### NFR-2: Accessibility
- Loading states must be announced to screen readers
- Loading indicators should have appropriate ARIA labels

### NFR-3: Maintainability
- Create reusable loading components
- Document the pattern for future development
- Make it easy to apply to new pages

## Success Criteria
1. No flickering "no data" messages on any page
2. All data-driven pages follow the four-stage loading flow
3. Loading states provide clear feedback to users
4. Implementation is DRY (Don't Repeat Yourself) with reusable components
5. Code is well-documented and easy for developers to follow

## Out of Scope
- Optimizing API response times (focus is on UI/UX during loading)
- Implementing pagination or infinite scroll
- Adding retry mechanisms for failed requests

## References
- Existing implementation: `/app/summary-food-milk/page.tsx` (has loading state pattern)
- Summary from context: User query #18 and #19 describe the desired behavior
