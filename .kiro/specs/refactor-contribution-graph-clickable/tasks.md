# Tasks: Refactor Contribution Graph - Clickable

## Phase 1: Preparation and Data Structure Setup

### 1.1 Define TypeScript Interfaces
- [x] 1.1.1 Add DateSquare interface to app/page.tsx
- [x] 1.1.2 Add WeekColumn interface to app/page.tsx
- [x] 1.1.3 Add MonthSpan interface to app/page.tsx
- [~] 1.1.4 Verify existing DayEntry and AttendanceSummary interfaces are correct

### 1.2 Create Helper Functions
- [~] 1.2.1 Implement parseLocalDate() function for consistent date parsing
- [~] 1.2.2 Implement getStatusColor() function to map status to color
- [~] 1.2.3 Implement formatMonthLabel() function for Thai month abbreviations

## Phase 2: Core Algorithm Implementation

### 2.1 Implement Date-to-Index Mapping
- [ ] 2.1.1 Create findDayIdxForDate() function
- [ ] 2.1.2 Add unit tests for findDayIdxForDate()
- [ ] 2.1.3 Handle edge cases (empty array, date not found, null values)

### 2.2 Implement Week Generation with Report Mapping
- [ ] 2.2.1 Create generateWeeksWithReportMapping() function
- [ ] 2.2.2 Calculate start date (Sunday before or equal to first attendance date)
- [ ] 2.2.3 Calculate end date (Saturday after or equal to last attendance date)
- [ ] 2.2.4 Generate DateSquare objects with hasReport and dayIdx properties
- [ ] 2.2.5 Create dateMap from attendanceSummary for O(1) lookup
- [ ] 2.2.6 Create dayEntriesMap for O(1) report lookup
- [ ] 2.2.7 Add unit tests for generateWeeksWithReportMapping()

### 2.3 Implement Month Span Calculation
- [ ] 2.3.1 Create calculateMonthSpans() function
- [ ] 2.3.2 Track month changes across weeks
- [ ] 2.3.3 Calculate week count for each month
- [ ] 2.3.4 Handle year boundaries correctly
- [ ] 2.3.5 Add unit tests for calculateMonthSpans()

## Phase 3: Component Refactoring

### 3.1 Extract Contribution Graph Logic
- [ ] 3.1.1 Wrap contribution graph section in useMemo for performance
- [ ] 3.1.2 Call generateWeeksWithReportMapping() with attendanceSummary and dayEntries
- [ ] 3.1.3 Call calculateMonthSpans() with generated weeks
- [ ] 3.1.4 Store results in memoized variables

### 3.2 Implement Month Labels Row
- [ ] 3.2.1 Create MonthLabelsRow component structure
- [ ] 3.2.2 Map over monthSpans to render labels
- [ ] 3.2.3 Calculate width for each label based on weekCount
- [ ] 3.2.4 Style labels (fontSize: 0.6rem, color: #64748b, fontWeight: 600)
- [ ] 3.2.5 Align labels with week columns below

### 3.3 Refactor Date Grid Layout
- [ ] 3.3.1 Remove month labels from inside week columns
- [ ] 3.3.2 Update grid container to use consistent gap (3px)
- [ ] 3.3.3 Ensure day labels column remains on the left
- [ ] 3.3.4 Update week column rendering to use new DateSquare objects

### 3.4 Implement Clickable Date Squares
- [ ] 3.4.1 Create handleDateClick() function with useCallback
- [ ] 3.4.2 Add onClick handler to date squares with hasReport=true
- [ ] 3.4.3 Disable onClick for date squares with hasReport=false
- [ ] 3.4.4 Update cursor style based on hasReport (pointer vs default)
- [ ] 3.4.5 Update opacity based on hasReport (1.0 vs 0.5)

### 3.5 Implement Selection Visual Feedback
- [ ] 3.5.1 Add border style logic to date squares
- [ ] 3.5.2 Apply 2px solid #6366f1 border when dayIdx matches
- [ ] 3.5.3 Remove border when dayIdx doesn't match
- [ ] 3.5.4 Ensure border doesn't affect square size (use box-sizing)
- [ ] 3.5.5 Add transition for smooth border appearance

## Phase 4: Remove Old DATE STRIP Component

### 4.1 Identify DATE STRIP Code
- [ ] 4.1.1 Search for DATE STRIP component in app/page.tsx
- [ ] 4.1.2 Identify all related state variables
- [ ] 4.1.3 Identify all related event handlers

### 4.2 Remove DATE STRIP
- [ ] 4.2.1 Remove DATE STRIP component from render tree
- [ ] 4.2.2 Remove unused state variables (if any)
- [ ] 4.2.3 Remove unused event handlers (if any)
- [ ] 4.2.4 Remove unused CSS classes (if any)
- [ ] 4.2.5 Verify no visual artifacts remain

## Phase 5: Testing and Validation

### 5.1 Unit Testing
- [ ] 5.1.1 Test findDayIdxForDate() with various inputs
- [ ] 5.1.2 Test generateWeeksWithReportMapping() with edge cases
- [ ] 5.1.3 Test calculateMonthSpans() with single and multiple months
- [ ] 5.1.4 Test handleDateClick() with valid and invalid dates
- [ ] 5.1.5 Achieve 90%+ code coverage for new functions

### 5.2 Integration Testing
- [ ] 5.2.1 Test full user flow: load page → click date → view report
- [ ] 5.2.2 Test switching between children updates graph correctly
- [ ] 5.2.3 Test empty data arrays don't cause errors
- [ ] 5.2.4 Test date selection persists during report loading
- [ ] 5.2.5 Test multiple rapid clicks don't cause race conditions

### 5.3 Visual Testing
- [ ] 5.3.1 Verify month labels align with week columns
- [ ] 5.3.2 Verify uniform spacing between all date squares
- [ ] 5.3.3 Verify selected date has blue border
- [ ] 5.3.4 Verify dates without reports are semi-transparent
- [ ] 5.3.5 Verify hover effects work on clickable dates
- [ ] 5.3.6 Verify no layout shift when clicking dates

### 5.4 Responsive Testing
- [ ] 5.4.1 Test on mobile viewport (375px width)
- [ ] 5.4.2 Test on tablet viewport (768px width)
- [ ] 5.4.3 Test on desktop viewport (1024px+ width)
- [ ] 5.4.4 Verify horizontal scrolling works on narrow screens
- [ ] 5.4.5 Verify touch interactions work on mobile devices

### 5.5 Browser Compatibility Testing
- [ ] 5.5.1 Test in Chrome (latest)
- [ ] 5.5.2 Test in Firefox (latest)
- [ ] 5.5.3 Test in Safari (latest)
- [ ] 5.5.4 Test in Edge (latest)
- [ ] 5.5.5 Fix any browser-specific issues

## Phase 6: Performance Optimization

### 6.1 Memoization
- [ ] 6.1.1 Wrap generateWeeksWithReportMapping() in useMemo
- [ ] 6.1.2 Wrap calculateMonthSpans() in useMemo
- [ ] 6.1.3 Wrap handleDateClick() in useCallback
- [ ] 6.1.4 Verify dependencies arrays are correct
- [ ] 6.1.5 Measure render performance before and after

### 6.2 Performance Validation
- [ ] 6.2.1 Measure initial render time (target: < 100ms)
- [ ] 6.2.2 Measure click response time (target: < 50ms)
- [ ] 6.2.3 Measure re-render time when switching children
- [ ] 6.2.4 Profile with React DevTools
- [ ] 6.2.5 Optimize any bottlenecks found

## Phase 7: Accessibility Improvements

### 7.1 Keyboard Navigation
- [ ] 7.1.1 Ensure date squares are focusable (tabIndex)
- [ ] 7.1.2 Add keyboard event handlers (Enter, Space)
- [ ] 7.1.3 Add focus visible styles
- [ ] 7.1.4 Test tab navigation flow
- [ ] 7.1.5 Ensure focus doesn't get trapped

### 7.2 Screen Reader Support
- [ ] 7.2.1 Add aria-label to date squares
- [ ] 7.2.2 Add role="button" to clickable date squares
- [ ] 7.2.3 Add aria-pressed for selected date
- [ ] 7.2.4 Test with screen reader (NVDA or VoiceOver)
- [ ] 7.2.5 Fix any announced text issues

### 7.3 Tooltips
- [ ] 7.3.1 Verify title attributes are present on date squares
- [ ] 7.3.2 Format tooltip text: "วันที่ DD MMM YY - สถานะ"
- [ ] 7.3.3 Test tooltips appear on hover
- [ ] 7.3.4 Ensure tooltips work on touch devices (long press)

## Phase 8: Documentation and Cleanup

### 8.1 Code Documentation
- [ ] 8.1.1 Add JSDoc comments to all new functions
- [ ] 8.1.2 Document function parameters and return types
- [ ] 8.1.3 Add inline comments for complex logic
- [ ] 8.1.4 Document any assumptions or constraints

### 8.2 Code Cleanup
- [ ] 8.2.1 Remove commented-out code
- [ ] 8.2.2 Remove unused imports
- [ ] 8.2.3 Remove unused variables (fix TypeScript warnings)
- [ ] 8.2.4 Format code consistently
- [ ] 8.2.5 Run linter and fix all issues

### 8.3 Update Documentation
- [ ] 8.3.1 Update README if needed
- [ ] 8.3.2 Document new component structure
- [ ] 8.3.3 Document data flow and state management
- [ ] 8.3.4 Add screenshots or diagrams if helpful

## Phase 9: Final Review and Deployment

### 9.1 Code Review
- [ ] 9.1.1 Self-review all changes
- [ ] 9.1.2 Check for TypeScript errors
- [ ] 9.1.3 Check for console warnings
- [ ] 9.1.4 Verify all requirements are met
- [ ] 9.1.5 Request peer review (if applicable)

### 9.2 User Acceptance Testing
- [ ] 9.2.1 Test with real user data
- [ ] 9.2.2 Test all user scenarios from requirements
- [ ] 9.2.3 Verify no regressions in other features
- [ ] 9.2.4 Get stakeholder approval
- [ ] 9.2.5 Document any known issues or limitations

### 9.3 Deployment Preparation
- [ ] 9.3.1 Create deployment checklist
- [ ] 9.3.2 Prepare rollback plan
- [ ] 9.3.3 Update version number (if applicable)
- [ ] 9.3.4 Tag release in version control
- [ ] 9.3.5 Deploy to production

## Phase 10: Post-Deployment Monitoring

### 10.1 Monitor for Issues
- [ ] 10.1.1 Monitor error logs for new errors
- [ ] 10.1.2 Monitor performance metrics
- [ ] 10.1.3 Collect user feedback
- [ ] 10.1.4 Track click-through rates on date squares
- [ ] 10.1.5 Address any issues promptly

### 10.2 Retrospective
- [ ] 10.2.1 Document lessons learned
- [ ] 10.2.2 Identify areas for improvement
- [ ] 10.2.3 Update development processes if needed
- [ ] 10.2.4 Plan future enhancements
- [ ] 10.2.5 Celebrate success! 🎉

---

## Task Summary

**Total Tasks**: 130
**Estimated Effort**: 3-5 days for experienced developer

**Critical Path**:
1. Phase 2: Core Algorithm Implementation (2.1, 2.2, 2.3)
2. Phase 3: Component Refactoring (3.1, 3.2, 3.3, 3.4, 3.5)
3. Phase 4: Remove Old DATE STRIP Component (4.1, 4.2)
4. Phase 5: Testing and Validation (5.1, 5.2, 5.3)

**Dependencies**:
- Phase 2 must complete before Phase 3
- Phase 3 must complete before Phase 4
- Phase 4 must complete before Phase 5
- Phase 5 must complete before Phase 6
- All phases must complete before Phase 9

**Risk Areas**:
- Date-to-index mapping correctness (2.1)
- Month span calculation across year boundaries (2.3)
- Performance with large date ranges (6.1, 6.2)
- Browser compatibility issues (5.5)
