# Spec: Refactor Contribution Graph - Clickable

**Feature Name**: refactor-contribution-graph-clickable  
**Workflow Type**: Design-First  
**Spec Type**: Feature  
**Status**: Ready for Implementation

## Overview

Refactor the attendance contribution graph in `app/page.tsx` to improve usability and visual design. The refactored graph will:

1. **Separate month labels** from the grid into a dedicated header row
2. **Pack date squares tightly** with uniform spacing (3px gap)
3. **Enable date selection** by making dates with reports clickable
4. **Provide visual feedback** with blue border for selected date and opacity for availability
5. **Remove redundant DATE STRIP** component entirely

## Current Issues

1. ❌ Month labels are inside each week column causing uneven spacing between squares
2. ❌ Cannot click on dates to view report details
3. ❌ DATE STRIP component is redundant and takes up space

## Desired Behavior

1. ✅ Month labels displayed in separate row above grid, spanning correct number of weeks
2. ✅ All date squares evenly spaced (gap: 3px) regardless of month boundaries
3. ✅ Each date square with a report is clickable to set dayIdx and display that day's report
4. ✅ Visual feedback:
   - Selected date has blue border (2px solid #6366f1)
   - Dates with reports are fully opaque and clickable
   - Dates without reports are semi-transparent (opacity: 0.5) and disabled
5. ✅ Old horizontal date strip component removed entirely

## Technical Context

- **File**: `app/page.tsx` (733 lines, React/TypeScript component)
- **State**: 
  - `dayEntries: DayEntry[]` - Array of {date, daily_id, report_id}
  - `dayIdx: number` - Currently selected index
  - `attendanceSummary: AttendanceSummary[]` - Array of {date, status}
- **Data Flow**: Click date → Find dayIdx → Update state → useEffect loads report

## Documents

### 📐 [design.md](./design.md)
Complete technical design with:
- Component architecture and data flow diagrams
- TypeScript interfaces (DateSquare, WeekColumn, MonthSpan)
- Core algorithms with formal specifications (preconditions, postconditions, loop invariants)
- Algorithmic pseudocode for week generation, month span calculation, and date mapping
- Example usage and code patterns
- Correctness properties (universal quantification statements)
- Error handling strategies
- Testing strategy (unit, property-based, integration)
- Performance and security considerations

### 📋 [requirements.md](./requirements.md)
Detailed requirements including:
- 8 functional requirements (month labels, spacing, clickability, visual feedback, etc.)
- 5 non-functional requirements (performance, accessibility, responsive design, etc.)
- 3 data requirements (attendance summary, day entries, enrollment period)
- 4 interface requirements (props, state management, event handling)
- Constraints, assumptions, and success metrics
- Explicitly out-of-scope items

### ✅ [tasks.md](./tasks.md)
Implementation task breakdown:
- **130 total tasks** organized into 10 phases
- **Estimated effort**: 3-5 days for experienced developer
- **Critical path**: Algorithm implementation → Component refactoring → Testing
- Phases include: preparation, core algorithms, component refactoring, testing, optimization, accessibility, documentation, deployment, and monitoring

## Key Algorithms

### 1. Generate Weeks with Report Mapping
```typescript
function generateWeeksWithReportMapping(
  attendanceSummary: AttendanceSummary[],
  dayEntries: DayEntry[]
): WeekColumn[]
```
- Generates weeks from Sunday to Saturday
- Maps each date to its dayIdx in dayEntries
- Marks dates with reports as clickable

### 2. Calculate Month Spans
```typescript
function calculateMonthSpans(weeks: WeekColumn[]): MonthSpan[]
```
- Determines which weeks belong to which month
- Calculates how many weeks each month label should span
- Handles month boundaries and year transitions

### 3. Find Day Index for Date
```typescript
function findDayIdxForDate(dateStr: string, dayEntries: DayEntry[]): number | null
```
- Maps clicked date to its index in dayEntries array
- Returns null if date not found
- Enables navigation to specific date's report

## Component Structure

```
ContributionGraph
├── MonthLabelsRow
│   └── MonthLabel (repeated for each month span)
├── GridContainer
│   ├── DayLabelsColumn
│   │   └── DayLabel × 7 (อา, จ, อ, พ, พฤ, ศ, ส)
│   └── WeeksGrid
│       └── WeekColumn (repeated for each week)
│           └── DateSquare × 7 (one per day)
```

## Success Criteria

### Functional
- ✅ 100% of dates with reports are clickable
- ✅ 100% of date clicks navigate to correct report
- ✅ 0 visual artifacts or layout issues
- ✅ 0 console errors or warnings

### User Experience
- ✅ Users can navigate to any date's report in 1 click
- ✅ Visual feedback is immediate (< 50ms)
- ✅ Graph is intuitive without instructions
- ✅ Mobile scrolling is smooth and responsive

### Code Quality
- ✅ TypeScript types are complete with no 'any' types
- ✅ Code is readable and maintainable
- ✅ Functions are pure and testable
- ✅ No code duplication

## Dependencies

**Internal**:
- Existing `dayIdx` state and `setDayIdx` function
- Existing `useEffect` for report loading
- Existing data fetching for `attendanceSummary` and `dayEntries`
- Existing status color constants

**External**:
- React (already in project)
- TypeScript (already in project)
- Next.js (already in project)
- **No new dependencies required**

## Testing Strategy

### Unit Tests
- Test `findDayIdxForDate()` with various inputs
- Test `generateWeeksWithReportMapping()` with edge cases
- Test `calculateMonthSpans()` with single and multiple months
- Test `handleDateClick()` with valid and invalid dates

### Property-Based Tests (fast-check)
- Month spans always cover all weeks
- Date mapping is bijective for dates with reports
- Selected date always has blue border

### Integration Tests
- Full user flow: load page → click date → view report
- Switching between children updates graph correctly
- Empty data arrays don't cause errors

### Visual Tests
- Month labels align with week columns
- Uniform spacing between all date squares
- Selected date has blue border
- Dates without reports are semi-transparent

## Implementation Notes

### Performance Optimizations
- Use `React.useMemo` for week generation (dependencies: attendanceSummary, dayEntries)
- Use `React.useMemo` for month span calculation (dependency: weeks)
- Use `React.useCallback` for handleDateClick (stable event handler)

### Accessibility
- Add `title` attributes for tooltips
- Add `tabIndex` for keyboard navigation
- Add `aria-label` for screen readers
- Add `role="button"` for clickable dates

### Browser Compatibility
- Target: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Uses CSS Grid and Flexbox (widely supported)
- No polyfills required

## Risk Areas

1. **Date-to-index mapping correctness** - Must handle all edge cases
2. **Month span calculation** - Must work across year boundaries
3. **Performance with large date ranges** - Must handle up to 52 weeks efficiently
4. **Browser compatibility** - Must test in all target browsers

## Next Steps

1. Review design and requirements documents
2. Begin Phase 1: Preparation and Data Structure Setup
3. Implement core algorithms (Phase 2)
4. Refactor component (Phase 3)
5. Remove old DATE STRIP (Phase 4)
6. Test thoroughly (Phase 5)
7. Optimize and deploy (Phases 6-9)

---

**Created**: 2024
**Last Updated**: 2024
**Spec ID**: f450a5bb-4fd3-4c74-a493-1e802ade9b4c
