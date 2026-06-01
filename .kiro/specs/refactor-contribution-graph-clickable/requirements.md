# Requirements Document: Refactor Contribution Graph - Clickable

## 1. Functional Requirements

### 1.1 Month Label Separation
**Priority**: High  
**Description**: Month labels (ม.ค., ก.พ., มี.ค., etc.) must be displayed in a separate row above the contribution grid, not inside individual week columns.

**Acceptance Criteria**:
- Month labels appear in a dedicated row above the date grid
- Each month label spans the correct number of week columns
- Month labels align horizontally with their corresponding week columns
- No month labels appear within the date grid itself

### 1.2 Uniform Grid Spacing
**Priority**: High  
**Description**: All date squares must be evenly spaced with consistent gap (3px) regardless of month boundaries.

**Acceptance Criteria**:
- Gap between all adjacent week columns is exactly 3px
- Month boundaries do not introduce extra spacing
- Date squares maintain 10px × 10px size
- Grid layout is visually uniform across all months

### 1.3 Date Square Clickability
**Priority**: High  
**Description**: Date squares that have associated reports must be clickable to navigate to that day's report.

**Acceptance Criteria**:
- Clicking a date square with a report updates the dayIdx state
- The report for the clicked date loads and displays
- Only dates with reports (report_id not null) are clickable
- Dates without reports are not clickable (disabled state)

### 1.4 Visual Feedback for Selection
**Priority**: High  
**Description**: The currently selected date must have clear visual indication with a blue border.

**Acceptance Criteria**:
- Selected date square has 2px solid #6366f1 border
- Only one date square has the blue border at a time
- Border updates immediately when a different date is clicked
- Border is visible and distinct from status colors

### 1.5 Visual Feedback for Availability
**Priority**: Medium  
**Description**: Date squares must visually indicate whether they have reports available.

**Acceptance Criteria**:
- Dates with reports are fully opaque (opacity: 1.0)
- Dates without reports are semi-transparent (opacity: 0.5)
- Cursor changes to pointer on hover for clickable dates
- Cursor remains default for non-clickable dates

### 1.6 Remove DATE STRIP Component
**Priority**: High  
**Description**: The old horizontal date strip component must be completely removed from the UI.

**Acceptance Criteria**:
- Old DATE STRIP component is removed from the render tree
- No visual artifacts or empty space where DATE STRIP was
- All date navigation functionality is handled by contribution graph
- Code related to DATE STRIP is removed or commented out

### 1.7 Date-to-Index Mapping
**Priority**: High  
**Description**: System must correctly map clicked dates to their corresponding index in the dayEntries array.

**Acceptance Criteria**:
- Clicking a date finds the correct index in dayEntries
- Index lookup handles dates not in dayEntries gracefully (returns null)
- Mapping works correctly for all dates in the enrollment period
- No off-by-one errors in index calculation

### 1.8 Month Span Calculation
**Priority**: High  
**Description**: System must calculate which weeks belong to which month for header labels.

**Acceptance Criteria**:
- Each week is assigned to exactly one month
- Month assignment based on first day of week (Sunday)
- Month spans are calculated correctly across year boundaries
- All weeks are covered by month labels with no gaps

## 2. Non-Functional Requirements

### 2.1 Performance
**Priority**: Medium  
**Description**: Contribution graph must render efficiently without blocking the UI.

**Acceptance Criteria**:
- Initial render completes within 100ms for up to 52 weeks of data
- Date click response time is under 50ms
- No visible lag when switching between children
- Memoization prevents unnecessary recalculations

### 2.2 Accessibility
**Priority**: Medium  
**Description**: Contribution graph must be accessible to users with disabilities.

**Acceptance Criteria**:
- Date squares have appropriate title attributes for tooltips
- Keyboard navigation is possible (tab through clickable dates)
- Screen readers can announce date and status information
- Color is not the only indicator of status (opacity also used)

### 2.3 Responsive Design
**Priority**: Medium  
**Description**: Contribution graph must work on various screen sizes.

**Acceptance Criteria**:
- Graph is horizontally scrollable on narrow screens
- Scrollbar is hidden but scrolling works (scrollbarWidth: none)
- Touch scrolling works smoothly on mobile devices
- Layout doesn't break on screens as narrow as 320px

### 2.4 Visual Consistency
**Priority**: Medium  
**Description**: Contribution graph styling must match the existing design system.

**Acceptance Criteria**:
- Colors match existing status colors (present: #10b981, absent: #ef4444, etc.)
- Font sizes and weights match existing UI (0.6rem for labels, weight 600)
- Border radius matches existing components (2px for squares)
- Spacing follows existing patterns (gap: 3px)

### 2.5 Browser Compatibility
**Priority**: Low  
**Description**: Contribution graph must work in modern browsers.

**Acceptance Criteria**:
- Works in Chrome, Firefox, Safari, Edge (latest 2 versions)
- CSS Grid and Flexbox features are supported
- No polyfills required for target browsers
- Graceful degradation for older browsers (if any)

## 3. Data Requirements

### 3.1 Attendance Summary Data
**Priority**: High  
**Description**: System requires attendance summary data for rendering the contribution graph.

**Acceptance Criteria**:
- attendanceSummary array contains objects with {date, status}
- Dates are in YYYY-MM-DD format
- Status values are: 'present', 'absent', 'sick', 'leave'
- Data is sorted chronologically

### 3.2 Day Entries Data
**Priority**: High  
**Description**: System requires day entries data for mapping dates to reports.

**Acceptance Criteria**:
- dayEntries array contains objects with {date, daily_id, report_id}
- Dates are in YYYY-MM-DD format
- report_id can be null for dates without reports
- Data is sorted chronologically

### 3.3 Enrollment Period Data
**Priority**: Medium  
**Description**: System should know the enrollment period for context.

**Acceptance Criteria**:
- enrollmentPeriod object contains {start, end}
- start is required, end can be null (ongoing enrollment)
- Dates are in YYYY-MM-DD format
- Period is displayed below the graph title

## 4. Interface Requirements

### 4.1 Component Props
**Priority**: High  
**Description**: Contribution graph component must accept necessary props.

**Acceptance Criteria**:
- Accepts attendanceSummary: AttendanceSummary[]
- Accepts dayEntries: DayEntry[]
- Accepts currentDayIdx: number
- Accepts onDateClick: (dayIdx: number) => void callback
- All props are properly typed with TypeScript

### 4.2 State Management
**Priority**: High  
**Description**: Component must integrate with existing state management.

**Acceptance Criteria**:
- Uses existing dayIdx state from parent component
- Calls setDayIdx when date is clicked
- Doesn't duplicate state unnecessarily
- State updates trigger report loading via existing useEffect

### 4.3 Event Handling
**Priority**: High  
**Description**: Component must handle user interactions correctly.

**Acceptance Criteria**:
- onClick handler attached to clickable date squares
- onMouseEnter/onMouseLeave for hover effects
- Event handlers are stable (useCallback if needed)
- No memory leaks from event listeners

## 5. Constraints

### 5.1 Technical Constraints
- Must use React functional components (no class components)
- Must use TypeScript for type safety
- Must work within existing Next.js app structure
- Cannot introduce new external dependencies for core functionality

### 5.2 Design Constraints
- Must maintain existing color scheme and status indicators
- Must fit within existing 480px max-width container
- Must not conflict with other UI elements on the page
- Must preserve existing mobile-first responsive design

### 5.3 Data Constraints
- Must handle up to 365 days (52 weeks) of data efficiently
- Must handle empty data arrays gracefully
- Must handle dates outside enrollment period
- Must handle missing or null report_id values

## 6. Assumptions

### 6.1 Data Assumptions
- attendanceSummary and dayEntries are loaded before graph renders
- Dates in both arrays are valid YYYY-MM-DD format strings
- Data is provided by existing API endpoints (no changes needed)
- Date ranges in both arrays are similar (may not be identical)

### 6.2 User Behavior Assumptions
- Users will primarily interact via touch on mobile devices
- Users expect immediate visual feedback on date selection
- Users understand the color coding for attendance status
- Users will scroll horizontally to view full date range if needed

### 6.3 System Assumptions
- React state updates are synchronous within the same render cycle
- useEffect for report loading is already implemented and working
- Browser supports CSS Grid, Flexbox, and modern JavaScript
- No server-side rendering issues with date calculations

## 7. Dependencies

### 7.1 Internal Dependencies
- Existing dayIdx state and setDayIdx function
- Existing useEffect for report loading
- Existing attendanceSummary and dayEntries data fetching
- Existing status color constants (attC, attBg)

### 7.2 External Dependencies
- React (already in project)
- TypeScript (already in project)
- Next.js (already in project)
- No new dependencies required

## 8. Success Metrics

### 8.1 Functional Success
- 100% of dates with reports are clickable
- 100% of date clicks navigate to correct report
- 0 visual artifacts or layout issues
- 0 console errors or warnings

### 8.2 User Experience Success
- Users can navigate to any date's report in 1 click
- Visual feedback is immediate (< 50ms)
- Graph is intuitive without instructions
- Mobile scrolling is smooth and responsive

### 8.3 Code Quality Success
- TypeScript types are complete with no 'any' types
- Code is readable and maintainable
- Functions are pure and testable
- No code duplication

## 9. Out of Scope

### 9.1 Explicitly Out of Scope
- Editing attendance data from the graph
- Filtering or searching dates
- Exporting graph as image
- Customizing colors or themes
- Multi-child comparison view
- Date range selection (only single date selection)
- Keyboard shortcuts beyond basic tab navigation
- Animations or transitions (beyond simple CSS transitions)

### 9.2 Future Enhancements (Not in This Spec)
- Tooltips with detailed attendance info on hover
- Legend explaining color codes
- Week numbers displayed
- Zoom in/out functionality
- Print-friendly view
- Accessibility improvements beyond basic requirements
