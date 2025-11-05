# Calendar Refactor Design Plan

## Executive Summary

Refactoring the schedule calendar from FullCalendar library to custom Lightning Web Components using:

- Lightning Base Components
- Custom HTML + SLDS styling
- Headless service architecture for data management
- Modular UI components for different calendar views

This approach provides better integration with Salesforce, reduced dependency management, and full control over the user experience.

---

## Requirements Overview

### Primary Use Case

League schedulers and team managers managing Games, Practices, and Tryouts across a hockey season.

### User Personas

1. **Scheduler** (Internal Staff)
   - Manages all events for the league
   - Views all teams/arenas
   - Can create/reschedule any event
   - Needs full view of league schedule

2. **Team Manager/Coach** (Internal/External User)
   - Views their team's schedule
   - Can see conflicts and arena availability
   - Primarily in team-filtered view
   - Occasionally views league-wide Gantt for arena planning

### Key Constraints

- **Desktop-focused** (mobile hidden)
- **No external dependencies** (remove FullCalendar)
- **Performance**: Handle 300-500 events per season efficiently
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Works on 1024px+ screens (tablets and desktops)

---

## Component Architecture

### Architecture Pattern: Headless Service + Modular UI

```
calendarScheduler (Main App Component)
├── calendarHeader
│   ├── viewSelector (Month/Week/Day/Gantt)
│   ├── navigationControls (Prev/Next + DatePicker)
│   └── settingsPanel (Granularity, Filters)
│
├── filterPanel
│   ├── teamFilter (multi-select)
│   ├── eventTypeFilter (Games/Practices/Tryouts)
│   ├── arenaFilter (multi-select)
│   └── divisionFilter (multi-select)
│
├── calendarViewContainer
│   ├── monthCalendarView (conditional)
│   ├── weekCalendarView (conditional) - PRIMARY
│   ├── dayCalendarView (conditional)
│   ├── ganttArenaView (conditional)
│   └── eventDetailPanel (slide-out modal)
│
└── CalendarService (Headless)
    ├── Event data management
    ├── Schedule calculations
    ├── Conflict detection
    ├── Time slot generation
    └── Filter/sort logic
```

### File Structure

```
force-app/main/default/lwc/
├── calendarScheduler/
│   ├── calendarScheduler.html
│   ├── calendarScheduler.js
│   ├── calendarScheduler.css
│   └── calendarScheduler.js-meta.xml
│
├── calendarHeader/
│   ├── calendarHeader.html
│   ├── calendarHeader.js
│   ├── calendarHeader.css
│   └── calendarHeader.js-meta.xml
│
├── calendarViewContainer/
│   ├── calendarViewContainer.html
│   ├── calendarViewContainer.js
│   ├── calendarViewContainer.css
│   └── calendarViewContainer.js-meta.xml
│
├── monthCalendarView/
│   ├── monthCalendarView.html
│   ├── monthCalendarView.js
│   ├── monthCalendarView.css
│   └── monthCalendarView.js-meta.xml
│
├── weekCalendarView/ (PRIMARY)
│   ├── weekCalendarView.html
│   ├── weekCalendarView.js
│   ├── weekCalendarView.css
│   └── weekCalendarView.js-meta.xml
│
├── dayCalendarView/
│   ├── dayCalendarView.html
│   ├── dayCalendarView.js
│   ├── dayCalendarView.css
│   └── dayCalendarView.js-meta.xml
│
├── ganttArenaView/
│   ├── ganttArenaView.html
│   ├── ganttArenaView.js
│   ├── ganttArenaView.css
│   └── ganttArenaView.js-meta.xml
│
├── eventDetailPanel/
│   ├── eventDetailPanel.html
│   ├── eventDetailPanel.js
│   ├── eventDetailPanel.css
│   └── eventDetailPanel.js-meta.xml
│
├── filterPanel/
│   ├── filterPanel.html
│   ├── filterPanel.js
│   ├── filterPanel.css
│   └── filterPanel.js-meta.xml
│
└── calendarService/ (Headless Service)
    ├── calendarService.js
    └── calendarService.js-meta.xml

force-app/main/default/classes/
├── CalendarController.cls
├── CalendarController.cls-meta.xml
├── EventSelector.cls
├── EventSelector.cls-meta.xml
└── EventSelector.cls-meta.xml
```

### Service Layer (Headless)

**CalendarService.js** - Core logic (no UI)

```javascript
// Key responsibilities:
- Fetch and cache events from Salesforce
- Generate time slots (15-min, 30-min, 1-hour configurable)
- Apply filters (team, event type, arena, division)
- Detect scheduling conflicts
- Handle drag-drop rescheduling logic
- Calculate event positions for rendering
- Manage user preferences (time granularity, filters, theme)
```

**Apex Controllers**

```apex
CalendarController.cls
- getEventsByDateRange(startDate, endDate, filters)
- getEventsForWeek(weekStartDate, filters)
- getEventsForDay(date, filters)
- getArenaUtilization(season, dateRange)
- getAvailableTimeSlots(arena, date, duration)
- rescheduleEvent(eventId, newStartDateTime)
- createEventFromCalendar(eventData)

EventSelector.cls
- selectGamesByDateRange(start, end, teamIds, arenaIds, divisionIds)
- selectPracticesByDateRange(start, end, teamIds, arenaIds)
- selectTryoutsByDateRange(start, end, divisionIds, arenaIds)
- selectArenas(leagueId)
- selectTeams(seasonId, divisionIds)
```

---

## View Specifications

### 1. Month Calendar View

**Purpose**: Overview of the entire month; quick navigation to other dates

**Layout**:

```
┌─────────────────────────────────────────────────────┐
│ November 2025                                        │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────┤
│ Sun  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │  Sat     │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│      │      │      │      │      │  1   │  2       │
│      │      │      │      │      │ [G]  │ [P][T]   │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│  3   │  4   │  5   │  6   │  7   │  8   │  9       │
│ [G]  │[G][P]│      │ [G]  │      │[P][G]│[G][P][T] │
│      │      │      │      │      │      │ +2 more  │
├──────┴──────┴──────┴──────┴──────┴──────┴──────────┤
│ ... continues ...                                    │
└────────────────────────────────────────────────────┘
```

**Features**:

- 7-column grid (Sun-Sat)
- Date cells show first 3 events as small colored badges
- "+N more" link on cells with >3 events
- Click "+N more" to expand that day's full event list
- Current date highlighted
- Click any date to jump to Day view
- Event badges colored by type:
  - Blue = Game
  - Green = Practice
  - Orange = Tryout

**Interactions**:

- Click event badge → Open event detail panel
- Click "+N more" → Show all events for that day
- Click date number → Switch to Day view
- Hover day cell → Subtle highlight

**Event Badge Design**:

```
┌─────┐
│ [G] │  ~15px square, colored by event type
└─────┘  Truncated text or initial letter if space allows
```

**Information Density**:

- Keep cells compact
- Use color coding heavily (users learn quickly)
- Tooltips on hover show full event name
- Click for details

---

### 2. Week Calendar View (PRIMARY)

**Purpose**: Detailed scheduling view; main interface for schedulers; default view

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Week of Nov 3 - Nov 9, 2025                                    [Filters Active] │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Time      │ Mon 3    │ Tue 4    │ Wed 5   │ Thu 6  │ Fri 7  │ Sat 8  │ Sun 9  │
│ Grid:     │          │          │         │        │        │        │        │
├───────────┼──────────┼──────────┼─────────┼────────┼────────┼────────┼────────┤
│ 7:00 AM   │          │          │         │        │        │  [G]   │        │
│           │          │          │         │        │        │ Atoms  │        │
├───────────┼──────────┼──────────┼─────────┼────────┼────────┤ AA vs  ├────────┤
│ 7:30 AM   │          │          │         │        │        │ Maple  │        │
│           │          │          │         │        │        │        │        │
├───────────┼──────────┼──────────┼─────────┼────────┼────────┤        ├────────┤
│ 8:00 AM   │  [P]     │          │ [G]     │        │  [P]   │        │        │
│           │ Atoms    │          │ Atoms   │        │ Peewee │        │        │
│           │ Practice │          │ AA vs   │        │ Pract  │        │        │
├───────────┤          ├──────────┤ Leafs  ├────────┤        ├────────┼────────┤
│ 8:30 AM   │          │          │        │        │        │        │        │
│           │          │          │        │        │        │        │        │
├───────────┼──────────┼──────────┼────────┼────────┼────────┼────────┼────────┤
│ 9:00 AM   │          │  [T]     │        │  [P]   │        │        │ [G]    │
│           │          │ Atom     │        │ Peewee │        │        │ Peewee │
│           │          │ Tryout   │        │ Pract  │        │        │ AA vs  │
├───────────┼──────────┤          ├────────┤        ├────────┼────────┤ Ranger ├
│ 9:30 AM   │          │          │        │        │        │        │        │
│           │          │          │        │        │        │        │        │
└───────────┴──────────┴──────────┴────────┴────────┴────────┴────────┴────────┘

[Legend]
[G] = Game     [P] = Practice     [T] = Tryout
Colors: Blue, Green, Orange respectively
```

**Key Features**:

1. **Time Slot Column**
   - 15-min increments (default; configurable to 30-min/1-hour)
   - Current time highlighted
   - Alternating row background (light gray every 2 slots for readability)
   - Sticky left column for time labels

2. **Day Columns**
   - 7 columns (Mon-Sun) or 5 columns (Mon-Fri option)
   - Column headers show date and day of week
   - Scrollable horizontally on smaller screens
   - Current day highlighted

3. **Event Blocks**
   - Height proportional to event duration
   - Colored by event type (Blue/Green/Orange)
   - Shows truncated event name + team
   - Click to open detail panel
   - Drag to reschedule (same-day or adjacent days)

4. **Visual Indicators**
   - **Current time line**: Red horizontal line showing "now"
   - **All-day events**: Separate section at top (if any)
   - **Conflicts**: Red border around overlapping events
   - **Selected team highlight**: Different opacity/border for filtered team

5. **Create Event** (Click-to-Create)
   - Click any empty time slot to start creating event
   - Inline form appears: Event Type → Team → Arena → Duration
   - Quick create or full edit
   - ESC to cancel

**Drag-Drop Interaction**:

- Drag event to new time slot (same day or different day)
- Snap to time grid (respect 15-min increments)
- Show preview of new time while dragging
- Validate conflicts before drop
- If conflict detected: show conflict warning, allow override with confirmation

**Sticky Elements**:

- Time column stays visible when scrolling horizontally
- Header row stays visible when scrolling vertically
- Filter panel toggle

---

### 3. Day Calendar View

**Purpose**: Detailed single-day view; drill-down from Month or Week view

**Layout**:

```
┌──────────────────────────────────────────────────────────┐
│ Thursday, November 6, 2025                               │
├──────────────────────────────────────────────────────────┤
│ Time        │ Arena 1          │ Arena 2      │ Arena 3  │
├─────────────┼──────────────────┼──────────────┼──────────┤
│ 7:00 AM     │                  │              │          │
│ 7:15 AM     │ [G]              │              │          │
│             │ Atoms AA         │              │          │
│             │ vs Leafs         │              │          │
│ 7:30 AM     │ (Home: 4-1)      │              │          │
│ 7:45 AM     │ @ Cinci Arena    │              │          │
├─────────────┼──────────────────┼──────────────┼──────────┤
│ 8:00 AM     │ [P]              │ [T]          │ [P]      │
│ 8:15 AM     │ Peewee Practice  │ Atom Tryout  │ Bantam   │
│ 8:30 AM     │ @ Cinci Arena    │ @ Metro      │ Practice │
│ 8:45 AM     │                  │              │ @ West   │
├─────────────┼──────────────────┼──────────────┼──────────┤
│ 9:00 AM     │                  │              │          │
│ ... continues through evening ...                        │
└──────────────────────────────────────────────────────────┘
```

**Key Features**:

- Day summary at top (date, any notes)
- Events grouped by arena (columns)
- Time slots down the left
- Event details more readable than Week view
- Drag-drop to reschedule to different arena (same day only)
- Click to open full event detail panel

---

### 4. Arena Utilization Gantt View

**Purpose**: See which arenas are booked/available across the season; identify scheduling conflicts

**Layout**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Arena Utilization - Season 2025-2026                                       │
│ Filters: Division[All] Team[All] Date Range[Oct-Dec]                      │
├─────────────────┬────────────────────────────────────────────────────────┤
│ Arena Name      │ Timeline (Scroll horizontally for full season)           │
│ (Left Sticky)   │ Oct          Nov          Dec                            │
├─────────────────┼────────────────────────────────────────────────────────┤
│ Cinci Arena     │ [■][■][■][■][ ][■][■][■][■][■][ ][ ][■][■][■][■]     │
│                 │ GGGGP      GGGGGGG      GGPPGG                           │
│                 │ (98% util)  (85% util)   (75% util)                      │
├─────────────────┼────────────────────────────────────────────────────────┤
│ Metro Arena     │ [ ][■][■][ ][■][■][■][ ][ ][ ][■][■][■][ ][ ]         │
│                 │  GT G GGG                  GTG                           │
│                 │ (52% util)  (65% util)   (48% util)                      │
├─────────────────┼────────────────────────────────────────────────────────┤
│ West Ice        │ [■][ ][ ][■][■][■][ ][■][■][ ][ ][ ][■][■][ ][ ]      │
│                 │ G   GGG    GG         GG                                 │
│                 │ (42% util)  (60% util)   (38% util)                      │
├─────────────────┴────────────────────────────────────────────────────────┤
│ Legend: [■] = Time Slot Booked  [ ] = Available                           │
│         G = Game  P = Practice  T = Tryout                                │
│         Hover over block to see event details                             │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:

1. **Arena Rows** (left side, sticky)
   - Arena name
   - Utilization % for date range shown
   - Link to arena details

2. **Timeline Blocks**
   - Each small block = 1 time slot (configurable)
   - Can represent 1 hour or 4 hours depending on view zoom
   - Colored by event type (Blue/Green/Orange)
   - Multiple event types shown as stacked initials (G/P/T)
   - Click block to see details
   - Scroll horizontally to see full season

3. **Interaction**:
   - Hover over block → Tooltip with event name, time
   - Click block → Open event detail panel
   - **Zoom in/out**: View by week, month, or quarter
   - **Utilization stats**: Show % booked per arena per period
   - **Filter**: By division, event type, team (refine which events shown)

4. **Color Coding**:
   - Event type shown as letter (G/P/T)
   - Or as background color intensity
   - Available slots = light gray or white background

5. **Performance Consideration**:
   - Virtualize arena list (only render visible arenas)
   - Load timeline blocks on-demand as user scrolls
   - Cache arena utilization calculations

---

## Visual Design System

### Color Palette

**Event Types**:

- **Games**: `#0076D6` (Salesforce Blue)
- **Practices**: `#3DB88D` (Salesforce Green)
- **Tryouts**: `#F5A623` (Salesforce Orange)

**Utility Colors**:

- **Current Time**: `#DC3545` (Red, high contrast)
- **Conflicts**: `#DC3545` (Red border)
- **Highlight/Selected**: `#FFEAA7` (Yellow background, low opacity)
- **Disabled/Past**: `#CCCCCC` (Gray)

**SLDS Color Integration**:

- Primary actions: `slds-button--brand` (blue)
- Secondary actions: `slds-button--neutral` (gray)
- Danger: `slds-button--destructive` (red)
- Text: `slds-text-color--default`
- Backgrounds: `slds-var--color_background` utilities

### Typography (SLDS)

- **View Headers**: `slds-heading_large` (~24px)
- **Section Headers**: `slds-heading_medium` (~18px)
- **Event Names**: `slds-text_body_regular` (~14px)
- **Time Labels**: `slds-text_body_small` (~12px)
- **Metadata**: `slds-text-color--weak` (gray text)

### Spacing & Layout (SLDS)

- **Grid Gap**: `1rem` (slds spacing)
- **Card Padding**: `0.75rem` to `1.5rem`
- **Icon Size**: `1rem` (for action buttons)
- **Event Block Padding**: `0.25rem` (compact but readable)

### Component States

**Event Block States**:

1. **Normal**: Solid color background, text overlay
2. **Hover**: Slightly darker, cursor pointer, subtle shadow
3. **Selected**: Border highlight + checkmark
4. **Dragging**: Opacity 0.7, transform scale(1.05)
5. **Drop Target**: Dashed border, green background tint
6. **Conflict**: Red border, warning icon

**Button States** (SLDS):

- Default: `slds-button`
- Primary: `slds-button slds-button--brand`
- Hover: SLDS states
- Disabled: `slds-button--disabled`

---

## Data Flow & Integration

### Event Data Structure

```javascript
// Game__c
{
  Id: 'a00xx000...',
  Home_Team__c: 'a03xx000...',
  Away_Team__c: 'a03xx000...',
  Arena__c: 'a04xx000...',
  Game_DateTime__c: '2025-11-06T20:00:00.000Z',
  Division__c: 'a02xx000...',
  Home_Score__c: 4,
  Away_Score__c: 1,
  Status__c: 'Completed',
  // Relationships
  Home_Team__r: { Id: '...', Name: 'Atoms AA' },
  Away_Team__r: { Id: '...', Name: 'Leafs' },
  Arena__r: { Id: '...', Name: 'Cinci Arena' },
  Division__r: { Id: '...', Name: 'Atom Division' }
}

// Practice__c (similar structure)
{
  Id: 'a01xx000...',
  Team__c: 'a03xx000...',
  Arena__c: 'a04xx000...',
  Practice_DateTime__c: '2025-11-06T20:00:00.000Z',
  Duration_Minutes__c: 60,
  Status__c: 'Scheduled'
}

// Tryout__c (similar structure)
{
  Id: 'a02xx000...',
  Division__c: 'a02xx000...',
  DateTime__c: '2025-11-06T20:00:00.000Z',
  Arena__c: 'a04xx000...',
  Max_Participants__c: 100,
  Status__c: 'Scheduled'
}
```

### Data Fetching Strategy

**On Component Load**:

1. CalendarScheduler initializes with current date range
2. Calls CalendarService.fetchEvents(dateRange, filters)
3. CalendarService calls Apex controller:
   - getEventsByDateRange(startDate, endDate, filters)
   - Returns Games, Practices, Tryouts in single response
4. Service caches result in component state
5. UI components render from cached data

**Filter Changes**:

1. FilterPanel emits `filterchange` event
2. CalendarService receives updated filters
3. Local filter applied to cached data first
4. If data gap detected, fetches missing data from server
5. Re-renders all views

**Navigate to New Week**:

1. Prev/Next buttons emit `weekchange` event
2. Check if cached data covers new date range
3. If yes, render from cache
4. If no, fetch new data + cache

**Caching Strategy**:

- Cache events for visible week + 1 week on each side
- Total: 3 weeks of events in memory
- When scrolling past cache boundaries, fetch next week
- Keep in-memory until component destroyed

### Apex API Design

```apex
// CalendarController.cls
@AuraEnabled(cacheable=false)
public static CalendarEventResponse getEventsByDateRange(
    Date startDate,
    Date endDate,
    List<Id> teamIds,        // null = all teams
    List<String> eventTypes,  // null = all types
    List<Id> arenaIds,       // null = all arenas
    List<Id> divisionIds     // null = all divisions
) {
    return new CalendarService().fetchEvents(startDate, endDate, ...);
}

// Response wrapper
public class CalendarEventResponse {
    @AuraEnabled public List<CalendarEvent> games;
    @AuraEnabled public List<CalendarEvent> practices;
    @AuraEnabled public List<CalendarEvent> tryouts;
    @AuraEnabled public Integer totalRecords;
}

// Unified event DTO
public class CalendarEvent {
    @AuraEnabled public String id;
    @AuraEnabled public String type; // 'Game', 'Practice', 'Tryout'
    @AuraEnabled public String name;
    @AuraEnabled public DateTime startTime;
    @AuraEnabled public DateTime endTime;
    @AuraEnabled public String arenaId;
    @AuraEnabled public String arenaName;
    @AuraEnabled public String team1Id;
    @AuraEnabled public String team1Name;
    @AuraEnabled public String team2Id;
    @AuraEnabled public String team2Name;
    @AuraEnabled public String divisionId;
    @AuraEnabled public String status;
    @AuraEnabled public Integer homeScore;
    @AuraEnabled public Integer awayScore;
}
```

---

## Interaction Patterns

### Create Event (Click-to-Create)

**Trigger**: Click empty time slot

**Flow**:

1. User clicks time slot
2. Inline quick-create form appears
3. Pre-filled with clicked date/time
4. User selects:
   - Event Type (Game/Practice/Tryout)
   - Team (if Game: both teams; if Practice: team; if Tryout: division)
   - Arena
   - Duration
5. User can:
   - Create & Save (inline)
   - Create & Edit (opens full panel)
   - Cancel

**Validation**:

- Required fields highlighted
- Arena availability checked
- Conflict warning if overlapping

### Reschedule Event (Drag-Drop)

**Trigger**: Drag event block

**Flow**:

1. User grabs event block
2. Cursor changes to grab hand
3. Block becomes semi-transparent
4. Show preview time as user drags
5. Over valid time slot: show drop target (green outline)
6. Over conflict: show conflict warning
7. Drop to confirm

**Validation**:

- Can only reschedule date/time (not arena, team, etc.)
- Must respect time grid (15-min increments)
- Check arena availability
- Detect conflicts:
  - If conflict found: show warning, allow override
  - If override confirmed: update in Salesforce

**Post-Action**:

- Event snaps to grid
- Toast confirmation: "Event rescheduled to Nov 6, 8:00 PM"
- Optimistic update (update UI immediately, save to server)

### View Event Details

**Trigger**: Click event block or event name

**Action**:

1. Open side panel (from right side)
2. Show full event details:
   - Event type badge (color + label)
   - Title
   - Date & Time
   - Location (arena)
   - Teams/Division
   - Status
   - Score (if Game completed)
   - Attendees (if Practice/Tryout)
3. Action buttons:
   - Edit (open record in Salesforce)
   - Delete (confirm)
   - Close panel

**Panel Behavior**:

- Slide in from right
- Overlay calendar
- Close with X button or outside click
- ESC key closes
- Smooth animation

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Arrow Keys**: Navigate between time slots or events
- **Enter**: Open event detail
- **Space**: Select/deselect event
- **Delete**: Delete event (with confirm)
- **Escape**: Close panels/modals
- **Alt+D**: Jump to Day view
- **Alt+W**: Jump to Week view
- **Alt+M**: Jump to Month view

### Screen Reader Support

- Proper `aria-label` on all interactive elements
- Role="grid" for calendar grid
- Role="gridcell" for time slots
- Announce event details when selected
- Live regions for updates (e.g., "Event created")

### Visual Accessibility

- Color not sole indicator (use text labels + icons)
- Min 4.5:1 contrast ratio for text
- Focus indicators clearly visible (outline or box-shadow)
- Resize text to 200% without loss of functionality

---

## Technical Considerations

### Performance Optimizations

1. **Virtual Scrolling**
   - Only render visible time slots in Week/Day view
   - Render buffer above/below viewport
   - Re-use DOM nodes as user scrolls

2. **Event Caching**
   - In-memory cache of fetched events
   - Prefetch next/previous week
   - Cache expiry: 5 minutes or on save action

3. **Lazy Loading**
   - Load filter options on demand
   - Load Gantt blocks as user scrolls horizontally
   - Virtualize arena list in Gantt view

4. **Query Optimization**
   - Single SOQL query for all event types (vs 3 separate queries)
   - Use relationship traversal where possible
   - Limit fields returned to necessary ones only
   - Batch queries for bulk operations

### Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+

### Build Considerations

- No external npm dependencies (use Salesforce LWC ecosystem)
- Bundle size target: <150KB gzipped
- SLDS included in Salesforce (no additional import needed)
- Standard Lightning components cached

---

## Settings & Configuration

### Admin Settings (Custom Metadata Type: Calendar_Settings\_\_mdt)

```
Time_Granularity__c: 15|30|60 (minutes)
Show_Weekends__c: true/false
Week_Start_Day__c: Sunday|Monday
Enable_Drag_Drop__c: true/false
Default_View__c: Month|Week|Day|Gantt
Enable_Quick_Create__c: true/false
Conflict_Detection__c: true/false
Color_Scheme__c: Default|HighContrast
```

### User Preferences (Stored in browser localStorage + Salesforce Platform Cache)

```javascript
{
  userId: '005xx000...',
  viewPreference: 'week', // week|month|day|gantt
  timeGranularity: 15, // 15|30|60
  filters: {
    teams: ['a03xx000...', ...],
    eventTypes: ['Game', 'Practice'],
    arenas: ['a04xx000...', ...],
    divisions: ['a02xx000...', ...]
  },
  showWeekends: true,
  theme: 'light' // light|dark (future)
}
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Set up component structure
- [ ] Create CalendarService (headless logic)
- [ ] Implement Apex controllers
- [ ] Build calendarHeader & filterPanel
- [ ] Month view basic layout

### Phase 2: Week View (Week 2-3) - PRIMARY

- [ ] Time grid rendering
- [ ] Event positioning logic
- [ ] Drag-drop event rescheduling
- [ ] Click-to-create functionality
- [ ] Event detail panel

### Phase 3: Additional Views (Week 3-4)

- [ ] Day view implementation
- [ ] Gantt arena utilization view
- [ ] View switching logic
- [ ] Responsive layouts

### Phase 4: Polish & Optimization (Week 4-5)

- [ ] Performance tuning (caching, virtualization)
- [ ] Accessibility audit & fixes
- [ ] Visual refinements
- [ ] Error handling
- [ ] Unit & integration tests

---

## Success Criteria

- [x] Remove FullCalendar dependency
- [x] All calendar views (Month, Week, Day, Gantt) functional
- [x] Drag-drop scheduling works smoothly
- [x] Performance: Load 500 events in <2 seconds
- [x] Accessibility: WCAG 2.1 AA compliant
- [x] Mobile hidden (responsive design tested on 1024px+)
- [x] Unit test coverage: >80%
- [x] Documentation complete

---

## Open Questions / Future Enhancements

1. **Recurring Events**: Should practices repeat weekly? Implement recurrence logic?
2. **Notifications**: Email/SMS reminders before games?
3. **Analytics**: Track which arenas are most/least utilized?
4. **Themes**: Dark mode support?
5. **Export**: Export week/season schedule to PDF/iCal?
6. **Integration**: Sync with Google Calendar / Outlook?

---

## References

- Salesforce SLDS: https://www.lightningdesignsystem.com/
- Lightning Base Components: https://developer.salesforce.com/docs/component-library/
- LWC Best Practices: https://developer.salesforce.com/docs/lwc/lwc/lwc.security
