# Calendar Refactor - Design Summary

## Project Overview

**Branch**: `feature/calendar-refactor`

**Objective**: Replace FullCalendar library with custom Lightning Web Components + SLDS styling + custom HTML

**Timeline**: 5 weeks estimated (Foundation → Week View → Other Views → Polish → Testing)

---

## Key Design Decisions Made

### 1. Architecture Pattern: Headless Service + Modular UI

```
CalendarService (No UI)
    ↓ (provides data)
UI Components (Month, Week, Day, Gantt views)
    ↓ (fire events)
CalendarService (processes actions)
    ↓ (calls Apex)
Salesforce Data
```

**Benefits**:

- ✅ Service is testable without rendering UI
- ✅ Easy to swap UI layers (add REST API consumers later)
- ✅ Reusable business logic across components
- ✅ Clear separation of concerns

### 2. View Priority: Week First

```
Priority 1: Week View (primary scheduling interface)
Priority 2: Month View (navigation & overview)
Priority 3: Day View (detailed single-day)
Priority 4: Gantt View (arena utilization)
```

**Rationale**: Week view has 80% of user interactions

### 3. User Interactions

| Interaction          | Implementation                           |
| -------------------- | ---------------------------------------- |
| Drag-drop reschedule | Mouse events + CSS transforms            |
| Click-to-create      | Inline quick-create form appears         |
| View event details   | Side panel slides in from right          |
| Filter events        | Service-layer filtering (no server call) |
| Navigate periods     | Prev/Next buttons + date picker          |

### 4. Time Granularity

- **Default**: 15-minute increments
- **Configurable**: Admin can change to 30-min or 1-hour via Custom Metadata
- **Stored**: User preference in localStorage + Salesforce Platform Cache

### 5. Conflict Detection

**Strategy**: Check before allowing reschedule

- Detect conflicting events at same arena
- Show warning with conflicting event details
- Allow override (with confirmation)

**Implementation**: Server-side validation in Apex (prevent data corruption)

### 6. Color Scheme

```
Games    → #0076D6 (Salesforce Blue)
Practices → #3DB88D (Salesforce Green)
Tryouts  → #F5A623 (Salesforce Orange)

Current Time → #DC3545 (Red)
Conflict → Red border
Available → Light gray/white
```

**Rationale**: Matches Salesforce Design System, high contrast, colorblind-friendly combinations possible with text labels

### 7. Caching Strategy

```
Events Cache:
- 3 weeks in memory (current ± 1 week)
- Auto-refresh on swipe/navigate past boundary
- Explicit clear on create/delete/update
- TTL: 5 minutes per cache entry

User Settings:
- localStorage: View preference, filters, time granularity
- Salesforce Platform Cache: Shared across sessions
```

### 8. Responsive Design

**Desktop-Focused**:

- Minimum: 1024px width (tablets + desktops)
- Mobile: Hidden (show alternative list view eventually)
- Layouts optimized for 1440px+ (common desktop resolution)

---

## Design Documents Created

### 1. **CALENDAR_REFACTOR_DESIGN_PLAN.md**

- Executive summary
- Requirements overview
- Component architecture (high-level)
- View specifications (detailed requirements)
- Visual design system
- Data flow
- Settings & configuration
- Success criteria

### 2. **CALENDAR_VISUAL_MOCKUPS.md**

- ASCII mockups for all 4 views
- Detailed layouts with annotations
- Component state variations (normal, hover, dragging, conflict)
- Color & styling reference
- Responsive behavior
- Interaction examples

### 3. **COMPONENT_ARCHITECTURE.md**

- Component tree
- Individual component specs:
  - calendarScheduler (main)
  - calendarHeader (navigation)
  - weekCalendarView (primary - most detailed)
  - monthCalendarView, dayCalendarView, ganttArenaView
  - eventDetailPanel, filterPanel
- CalendarService specification (headless logic)
- Data models & interfaces
- Apex controller specs
- Communication patterns
- State management
- Performance optimizations

---

## Visual Design Highlights

### Week View (Primary) - Key Features

```
┌─────────────┐
│   Monday    │  ← Day header (sticky)
├─────────────┤
│ 7:00 AM     │
│ [Event]     │  ← Color-coded event block
│ (draggable) │     Height = duration
│ 7:30 AM     │
│ 8:00 AM     │  ← Alternating row backgrounds
│ [Event]     │     for readability
└─────────────┘

Red horizontal line shows current time
Click empty slot to create
Drag events to reschedule
```

### All Views Support

| Feature           | Month | Week | Day | Gantt |
| ----------------- | ----- | ---- | --- | ----- |
| View overview     | ✅    | -    | -   | ✅    |
| Detailed schedule | -     | ✅   | ✅  | -     |
| Drag-drop         | ❌    | ✅   | ✅  | ❌    |
| Quick create      | ❌    | ✅   | ✅  | ❌    |
| Filter support    | ✅    | ✅   | ✅  | ✅    |
| Arena view        | ❌    | ❌   | ✅  | ✅    |

---

## Component Folder Structure

```
force-app/main/default/lwc/
├── calendarScheduler/              (Main app component)
│   ├── calendarScheduler.html
│   ├── calendarScheduler.js
│   ├── calendarScheduler.css
│   └── calendarScheduler.js-meta.xml
│
├── calendarHeader/
├── filterPanel/
├── monthCalendarView/
├── weekCalendarView/               (Complex - 500+ lines)
├── dayCalendarView/
├── ganttArenaView/
├── eventDetailPanel/
├── quickCreateForm/
│
└── calendarService/                (Headless - No HTML)
    ├── calendarService.js          (~800 lines)
    └── calendarService.js-meta.xml

force-app/main/default/classes/
├── CalendarController.cls          (Apex - 800+ lines)
├── CalendarController.cls-meta.xml
├── EventSelector.cls               (Query logic)
├── EventSelectorTest.cls
└── CalendarControllerTest.cls
```

---

## Key Technical Decisions

### 1. No External Libraries (except SLDS)

**Decision**: Use only Lightning Base Components + custom HTML

**Rationale**:

- ✅ Reduces dependencies
- ✅ Smaller bundle size
- ✅ Better Salesforce integration
- ✅ No FullCalendar license cost
- ❌ More custom code to write

### 2. Service-Layer Filtering vs. Server-Side

**Decision**: Apply filters in CalendarService (local), fetch once

**Rationale**:

- ✅ Faster filter changes (no server call)
- ✅ Better UX (instant feedback)
- ✅ Simpler server code
- ❌ Larger initial payload (mitigated by caching)

### 3. Optimistic Updates for Drag-Drop

**Decision**: Update UI immediately, save to server async

**Rationale**:

- ✅ Better perceived performance
- ✅ Snappier UX for 99% of cases
- ✅ Auto-retry on failure
- ⚠️ Risk: Show wrong state briefly if conflict not caught

**Mitigation**: Server validates conflicts, rejects if invalid

### 4. Calendar Grid vs. Event-Based Layout

**Decision**: Use time-slot grid (not event-based)

**Rationale**:

- ✅ Easier to implement drag-drop
- ✅ Shows availability/gaps clearly
- ✅ Standard calendar UX users expect
- ❌ Requires scrolling for large time ranges

### 5. Apex Controller vs. Apex Class

**Decision**: Use Controller pattern (callable from LWC)

**Rationale**:

- ✅ @AuraEnabled for LWC integration
- ✅ Familiar pattern from existing codebase
- ✅ Easy to test
- ✅ Supports cacheable for future optimization

---

## Data Flow Example: Reschedule Event

```
1. User drags event
   └─ weekCalendarView: handleEventDragStart()

2. Drag over new time slot
   └─ weekCalendarView: handleCellDragOver()
   └─ Visual: Show drop preview + time

3. User drops
   └─ weekCalendarView: handleCellDrop()
   └─ Calculate new DateTime

4. Check for conflicts
   └─ CalendarService: detectConflicts()
   └─ Call: CalendarController.getConflictingEvents()
   └─ Result: List of conflicts

5a. No conflicts
   └─ Optimistically update UI
   └─ Call: CalendarService.rescheduleEvent()
   └─ Call: CalendarController.rescheduleEvent()
   └─ Apex updates Game__c.Game_DateTime__c
   └─ Success: Show toast, cache cleared

5b. Conflicts detected
   └─ Show warning modal
   └─ User can override or cancel
   └─ If override: Proceed with update
   └─ If cancel: Revert UI change
```

---

## Performance Targets

| Operation                | Target  | Implementation                          |
| ------------------------ | ------- | --------------------------------------- |
| Initial page load        | <2 sec  | Lazy load event data, virtual scrolling |
| Switch view (week→month) | <300 ms | Pre-cached events, no server call       |
| Filter change            | <500 ms | Debounce (300ms) + service filtering    |
| Drag-drop response       | <100 ms | Optimistic update + async save          |
| Scroll 1000 items        | 60 FPS  | Virtual scrolling, CSS transforms       |
| Fetch 500 events         | <1 sec  | SOQL optimization, relationship loading |

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

- ✅ Tab through all interactive elements
- ✅ Arrow keys navigate time slots
- ✅ Enter to open event/create
- ✅ ESC to cancel/close
- ✅ Alt+M/W/D/G for quick view switch

### Screen Reader Support

- ✅ Semantic HTML (role="grid", aria-labels)
- ✅ Live regions for updates
- ✅ Hidden status text for icons
- ✅ Form labels associated

### Visual Accessibility

- ✅ 4.5:1 contrast ratio for text
- ✅ Color + text/icon for meaning
- ✅ 2px focus indicators
- ✅ Touch targets min 44x44px

---

## Testing Strategy

### Unit Tests (TDD approach)

**CalendarService**:

- ✅ Time slot generation
- ✅ Event filtering
- ✅ Conflict detection
- ✅ Cache management
- ✅ Event creation/reschedule logic

**Apex Controllers**:

- ✅ Event query logic
- ✅ Conflict detection accuracy
- ✅ Reschedule validation
- ✅ Security (CRUD/FLS)

### Component Tests

**Week View**:

- ✅ Render events correctly
- ✅ Drag-drop calculations
- ✅ Quick create form
- ✅ Filter application

**Other Views**:

- ✅ Layout correctness
- ✅ Interaction handlers
- ✅ Data binding

### E2E / User Acceptance Tests

- Scheduler creates and reschedules games
- Team manager views their team's schedule
- Filter features work correctly
- Gantt shows arena utilization accurately
- Mobile access properly hidden

---

## Rollout Plan

### Phase 1: Week View Only (Week 2)

- Deploy core infrastructure
- Week view fully functional
- Month view as basic read-only fallback
- Feature flag hidden until ready

### Phase 2: Add Other Views (Week 3-4)

- Month, Day, Gantt views
- Full filtering support
- Polish interactions

### Phase 3: QA & Polish (Week 4-5)

- Performance tuning
- Accessibility audit
- Bug fixes
- Training materials

### Phase 4: Go-Live

- Remove FullCalendar dependency
- Update all app pages
- Sunset old calendar code

---

## Open Questions for Clarification

Before coding starts, confirm:

1. **All-day Events**: How should they be handled? Separate section?
2. **Recurring Events**: Do practices repeat weekly? Need recurrence logic?
3. **Notifications**: Email/SMS reminders via calendar? Out of scope?
4. **Search**: Find events by name/team/arena? Separate feature?
5. **Sharing**: Multi-league support or single league per org?
6. **Mobile Tablet**: Should iPad (1024px) have full calendar or list view?
7. **Analytics**: Track user interactions for improvements?
8. **Export**: Export week/season to PDF or iCal?

---

## Next Steps (Implementation Phase)

### Week 1: Foundation

- [ ] Create component structure/folders
- [ ] Implement CalendarService (core logic)
- [ ] Create CalendarController & EventSelector (Apex)
- [ ] Build calendarHeader & filterPanel
- [ ] Basic month view layout

### Week 2: Week View (Primary)

- [ ] Time slot generation & rendering
- [ ] Event block positioning
- [ ] Drag-drop event rescheduling
- [ ] Click-to-create quick form
- [ ] Event detail panel

### Week 3: Additional Views

- [ ] Month view refinements
- [ ] Day view (arena columns)
- [ ] Gantt view (arena utilization)
- [ ] View switching animation

### Week 4: Polish & Optimize

- [ ] Performance tuning (virtual scrolling)
- [ ] Accessibility fixes
- [ ] Visual refinements
- [ ] Error handling
- [ ] Loading states

### Week 5: Testing & Deployment

- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] UAT with real users
- [ ] Bug fixes
- [ ] Deploy to production

---

## Success Criteria

- [x] Design planning complete (this document)
- [ ] Week view fully functional & tested
- [ ] All 4 views working with filtering
- [ ] Drag-drop scheduling smooth
- [ ] Performance: 500 events load < 1 second
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Test coverage: 80%+
- [ ] FullCalendar dependency removed
- [ ] User acceptance testing passed
- [ ] Documentation complete

---

## References & Resources

### Salesforce Documentation

- Lightning Design System: https://www.lightningdesignsystem.com/
- Lightning Base Components: https://developer.salesforce.com/docs/component-library/
- LWC Best Practices: https://developer.salesforce.com/docs/lwc/

### Design Inspiration

- Google Calendar (clean time grid)
- Outlook Calendar (drag-drop behavior)
- Calendly (modern aesthetics)
- Gantt chart examples (timeline visualization)

### Internal Resources

- SportsForce CLAUDE.md (project context)
- Existing Game/Practice/Tryout objects (data model)
- Current scheduleCalendar LWC (FullCalendar implementation)

---

## Design Approval Checklist

Before implementation starts:

- [ ] Stakeholder approval on visual mockups
- [ ] Confirmation of all 4 views needed
- [ ] Agreement on color scheme
- [ ] Confirmation of time granularity defaults
- [ ] Mobile behavior confirmed (hidden or list view?)
- [ ] Accessibility requirements confirmed
- [ ] Performance targets agreed
- [ ] Timeline realistic?
- [ ] Architecture pattern understood?
- [ ] Component responsibilities clear?

---

## Document Inventory

This design phase produced:

1. ✅ **CALENDAR_REFACTOR_DESIGN_PLAN.md** (50+ pages)
   - Overall vision, requirements, design system, data flow

2. ✅ **CALENDAR_VISUAL_MOCKUPS.md** (40+ pages)
   - ASCII mockups, layouts, interactions for all views

3. ✅ **COMPONENT_ARCHITECTURE.md** (60+ pages)
   - Detailed component specs, code examples, service layer

4. ✅ **DESIGN_SUMMARY.md** (this document)
   - High-level overview, key decisions, rollout plan

**Total**: 150+ pages of design documentation

---

## Conclusion

The calendar refactor is fully designed and ready for implementation. The modular, headless service architecture provides:

- ✅ Clean separation of concerns
- ✅ Testable business logic
- ✅ Reusable components
- ✅ Strong performance optimization
- ✅ Accessibility-first approach
- ✅ Clear implementation roadmap

The design prioritizes **Week view** (80% of usage), then adds Month, Day, and Gantt views in subsequent phases. All interactions are specified, data flows documented, and performance targets defined.

**Ready to proceed with implementation!**
