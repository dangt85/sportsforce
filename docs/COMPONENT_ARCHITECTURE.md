# Component Architecture & Technical Specifications

## Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Component Specifications](#component-specifications)
3. [Service Layer Design](#service-layer-design)
4. [Data Models & Interfaces](#data-models--interfaces)
5. [Apex Controller Specifications](#apex-controller-specifications)
6. [Communication Patterns](#communication-patterns)
7. [State Management](#state-management)
8. [Performance Considerations](#performance-considerations)

---

## Component Hierarchy

### Component Tree

```
calendarScheduler (Main Container - App Page)
│
├── calendarHeader
│   ├── View Selector (Month/Week/Day/Gantt buttons)
│   ├── Navigation Controls (Prev/Next + DatePicker)
│   ├── Settings Panel Trigger
│   └── Help/Info
│
├── filterPanel (Collapsible)
│   ├── Team Multi-Select
│   ├── Event Type Checkboxes
│   ├── Arena Multi-Select
│   ├── Division Multi-Select
│   └── Additional Options (Hide Past, etc.)
│
├── calendarViewContainer
│   ├── monthCalendarView (v-if currentView === 'month')
│   │   ├── Month Grid
│   │   └── Event Day Cells
│   │
│   ├── weekCalendarView (v-if currentView === 'week') [PRIMARY]
│   │   ├── Time Column
│   │   ├── Day Columns (7x)
│   │   ├── Event Blocks
│   │   ├── Quick Create Form
│   │   └── Current Time Indicator
│   │
│   ├── dayCalendarView (v-if currentView === 'day')
│   │   ├── Arena Columns
│   │   ├── Time Grid
│   │   ├── Event Blocks
│   │   └── Quick Create Form
│   │
│   └── ganttArenaView (v-if currentView === 'gantt')
│       ├── Arena Rows
│       ├── Timeline Blocks
│       ├── Utilization Stats
│       └── Zoom Controls
│
├── eventDetailPanel (Slide-out modal)
│   ├── Event Header (Type + Title)
│   ├── Event Details (Date, Time, Location)
│   ├── Expandable Sections (Roster, Details)
│   └── Action Buttons (Edit, Delete, Export)
│
└── CalendarService (Headless - No UI)
    ├── Event Data Management
    ├── Filter & Sort Logic
    ├── Conflict Detection
    ├── Time Slot Calculation
    ├── Cache Management
    └── State Bus (for cross-component communication)
```

---

## Component Specifications

### 1. calendarScheduler (Main Component)

**Purpose**: Container and orchestrator for entire calendar system

**Responsibilities**:

- Initialize CalendarService
- Manage main state (currentView, selectedDate, filters, etc.)
- Coordinate between header, filters, and views
- Handle navigation events
- Manage side panel visibility

**Properties**:

```javascript
// Input Props (if used on app page)
@api recordId;     // Could be League or Season ID
@api defaultView; // 'week' (default) | 'month' | 'day' | 'gantt'

// Internal State
currentView: 'week' | 'month' | 'day' | 'gantt'
selectedDate: Date
filters: {
  teams: Id[],
  eventTypes: string[],
  arenas: Id[],
  divisions: Id[]
}
events: CalendarEvent[]
selectedEvent: CalendarEvent | null
showDetailPanel: boolean
loading: boolean
error: string | null
```

**Methods**:

```javascript
handleViewChange(view); // Switch between views
handleDateChange(date); // Navigate to different date
handleFilterChange(filters); // Update filters
handleEventClick(event); // Open detail panel
handleCreateClick(); // Start create flow
handleSettingsChange(); // Apply user settings
```

**Template Structure**:

```html
<template>
  <!-- Header Navigation -->
  <c-calendar-header
    current-view="{currentView}"
    selected-date="{selectedDate}"
    on-view-change="{handleViewChange}"
    on-date-change="{handleDateChange}"
    on-settings-click="{handleSettingsClick}"
  ></c-calendar-header>

  <!-- Filter Panel -->
  <c-filter-panel
    filters="{filters}"
    on-filter-change="{handleFilterChange}"
  ></c-filter-panel>

  <!-- View Container (Conditional) -->
  <div class="calendar-view-container">
    <c-month-calendar-view
      lwc:if="{currentView"
      =""
      =""
      ="month"
      }
      events="{events}"
      selected-date="{selectedDate}"
      on-event-click="{handleEventClick}"
      on-date-select="{handleDateChange}"
    ></c-month-calendar-view>

    <c-week-calendar-view
      lwc:if="{currentView"
      =""
      =""
      ="week"
      }
      events="{events}"
      selected-date="{selectedDate}"
      on-event-click="{handleEventClick}"
      on-time-slot-click="{handleTimeSlotClick}"
      on-event-drop="{handleEventDrop}"
    ></c-week-calendar-view>

    <!-- Other views... -->
  </div>

  <!-- Detail Panel (Slide-out) -->
  <c-event-detail-panel
    lwc:if="{showDetailPanel}"
    event="{selectedEvent}"
    on-close="{handlePanelClose}"
    on-edit="{handleEventEdit}"
    on-delete="{handleEventDelete}"
  ></c-event-detail-panel>

  <!-- Loading / Error states -->
  <lightning-spinner lwc:if="{loading}"></lightning-spinner>
  <div class="error-alert" lwc:if="{error}">{error}</div>
</template>
```

**Lifecycle**:

```javascript
connectedCallback() {
  // Initialize CalendarService
  this.calendarService = new CalendarService(this.recordId);

  // Load initial events for current week
  this.loadEventsForDateRange(this.getWeekRange(this.selectedDate));

  // Subscribe to service updates
  this.calendarService.on('eventsUpdated', this.handleEventsUpdated);
}

disconnectedCallback() {
  // Clean up subscriptions
  this.calendarService.unsubscribe();
}
```

---

### 2. calendarHeader

**Purpose**: Navigation and view selection controls

**Input Props**:

```javascript
@api currentView: 'week' | 'month' | 'day' | 'gantt'
@api selectedDate: Date
```

**Output Events**:

```javascript
// Fire these custom events
dispatchEvent(new CustomEvent("viewchange", { detail: view }));
dispatchEvent(new CustomEvent("datechange", { detail: date }));
dispatchEvent(
  new CustomEvent("settingsclick", {
    /* ... */
  })
);
```

**Template Features**:

```html
<header class="calendar-header">
  <!-- Navigation -->
  <lightning-button-icon
    icon-name="utility:chevronleft"
    on-click={handlePreviousPeriod}
  ></lightning-button-icon>

  <h2>{periodDisplay}</h2>

  <lightning-button-icon
    icon-name="utility:chevronright"
    on-click={handleNextPeriod}
  ></lightning-button-icon>

  <!-- Today Button -->
  <lightning-button
    label="Today"
    on-click={handleTodayClick}
  ></lightning-button>

  <!-- Date Picker -->
  <lightning-input
    type="date"
    value={selectedDate}
    on-change={handleDatePickerChange}
  ></lightning-input>

  <!-- View Selector -->
  <div class="view-selector">
    <lightning-button
      label="Month"
      variant={currentView === 'month' ? 'brand' : 'neutral'}
      on-click={() => this.handleViewChange('month')}
    ></lightning-button>
    <!-- Week, Day, Gantt buttons... -->
  </div>

  <!-- Settings -->
  <lightning-button-icon
    icon-name="utility:settings"
    on-click={handleSettingsClick}
  ></lightning-button-icon>
</header>
```

---

### 3. weekCalendarView (PRIMARY - Most Complex)

**Purpose**: Main scheduling interface with time grid

**Input Props**:

```javascript
@api events: CalendarEvent[]  // Pre-filtered events
@api selectedDate: Date        // Start date of week
@api timeGranularity: 15 | 30 | 60  // Minutes per slot
@api showWeekends: boolean
```

**Output Events**:

```javascript
dispatchEvent(new CustomEvent("eventclick", { detail: event }));
dispatchEvent(new CustomEvent("timeslotclick", { detail: { date, time } }));
dispatchEvent(
  new CustomEvent("eventdrop", { detail: { eventId, newDateTime } })
);
```

**Internal State**:

```javascript
weekStartDate: Date              // First day of displayed week
dayColumns: Array<Date>          // Array of 7 dates (or 5 if no weekends)
timeSlots: Array<string>         // ['7:00 AM', '7:15 AM', ...]
draggedEvent: CalendarEvent      // Event being dragged
dragStartPosition: { x, y }
dropTarget: { dayIndex, slotIndex }  // Where it will land
quickCreateSlot: { dayIndex, slotIndex } | null
```

**Key Methods**:

```javascript
// Rendering
getWeekRange(date): Date[]        // Calculate Mon-Sun for date
generateTimeSlots(granularity)    // Create slot labels
getEventsForSlot(dayIndex, slotIndex): CalendarEvent[]

// Drag-Drop
handleEventDragStart(event)
handleEventDragOver(event)
handleEventDrop(event)            // Save to Salesforce

// Create
handleTimeSlotClick(dayIndex, slotIndex)
handleQuickCreateSubmit(data)

// Utilities
calculateEventBlockPosition(event): { top, height }
isTimeSlotAvailable(date, startTime, duration): boolean
```

**Drag-Drop Mechanics**:

```javascript
handleEventMouseDown(event) {
  this.draggedEvent = event;
  this.isDragging = true;
  event.target.style.opacity = '0.7';
}

handleCellDragOver(event) {
  event.preventDefault();  // Allow drop
  const { dayIndex, slotIndex } = this.getSlotFromElement(event.target);
  this.dropTarget = { dayIndex, slotIndex };
  this.showDropPreview(dayIndex, slotIndex);
}

handleCellDrop(event) {
  event.preventDefault();
  const newDateTime = this.calculateDateTime(
    this.dayColumns[this.dropTarget.dayIndex],
    this.dropTarget.slotIndex
  );

  // Check conflicts
  if (this.hasConflict(this.draggedEvent, newDateTime)) {
    this.showConflictWarning(() => {
      this.rescheduleEvent(this.draggedEvent.id, newDateTime);
    });
  } else {
    this.rescheduleEvent(this.draggedEvent.id, newDateTime);
  }
}

rescheduleEvent(eventId, newDateTime) {
  // Call Apex to update
  updateEvent({ id: eventId, dateTime: newDateTime })
    .then(() => {
      this.fireEvent('eventdrop', { eventId, newDateTime });
    });
}
```

**Template Structure**:

```html
<div class="week-calendar">
  <!-- Header Row -->
  <div class="calendar-grid">
    <div class="time-column header"></div>
    <template for:each="{dayColumns}" for:item="day">
      <div key="{day}" class="day-column header">
        {getDayLabel(day)}
        <!-- "Mon 3" -->
      </div>
    </template>
  </div>

  <!-- Time Slots -->
  <div class="calendar-grid">
    <!-- Left: Time Labels -->
    <div class="time-column">
      <template for:each="{timeSlots}" for:item="slot">
        <div key="{slot}" class="time-slot-label">
          {slot}
          <!-- "7:00 AM" -->
        </div>
      </template>
    </div>

    <!-- Days: Event Grid -->
    <template for:each="{dayColumns}" for:item="day">
      <div key="{day}" class="day-column">
        <template for:each="{timeSlots}" for:item="slot">
          <div
            key="{slot}"
            class="time-slot"
            data-day="{day}"
            data-slot="{slot}"
            on-click="{handleTimeSlotClick}"
            on-dragover="{handleCellDragOver}"
            on-drop="{handleCellDrop}"
          >
            <!-- Event blocks rendered here -->
            <template for:each="{getEventsForSlot(day," slot)} for:item="event">
              <div
                key="{event.id}"
                class="event-block {event.type}"
                draggable="true"
                on-dragstart="{handleEventDragStart}"
                on-dragend="{handleEventDragEnd}"
                on-click="{handleEventClick}"
                style="{getEventBlockStyle(event)}"
              >
                <span class="event-name">{event.name}</span>
                <span class="event-time">{event.startTime}</span>
              </div>
            </template>

            <!-- Quick Create Form (if active) -->
            <c-quick-create-form
              lwc:if="{quickCreateSlot"
              =""
              =""
              ="slot}"
              on-submit="{handleQuickCreateSubmit}"
              on-cancel="{handleQuickCreateCancel}"
            ></c-quick-create-form>
          </div>
        </template>
      </div>
    </template>
  </div>

  <!-- Current Time Indicator -->
  <div class="current-time-line" style="{currentTimeLinePosition}"></div>
</div>
```

**Styling Considerations**:

```css
.calendar-grid {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr); /* Time + 7 days */
  gap: 1px;
  border: 1px solid #d8dce6;
}

.time-column {
  background: #f4f6f9;
  position: sticky;
  left: 0;
  z-index: 10;
}

.day-column {
  display: flex;
  flex-direction: column;
}

.time-slot {
  min-height: 60px; /* Height for 15-min slot */
  border: 1px solid #e3e5e7;
  background: white;
  position: relative;
}

.time-slot:nth-child(odd) {
  background: #fafbfc; /* Alternate row color */
}

.event-block {
  position: absolute;
  left: 2px;
  right: 2px;
  padding: 4px;
  border-radius: 2px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: grab;
  border-left: 4px solid;
}

.event-block.Game {
  background: #0076d6; /* Salesforce Blue */
  border-left-color: #004a99;
}

.event-block.Practice {
  background: #3db88d; /* Salesforce Green */
  border-left-color: #2a8f6e;
}

.event-block.Tryout {
  background: #f5a623; /* Salesforce Orange */
  border-left-color: #d48400;
}

.event-block:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  filter: brightness(1.1);
}

.event-block.dragging {
  opacity: 0.7;
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.current-time-line {
  position: absolute;
  height: 2px;
  background: #dc3545;
  left: 0;
  right: 0;
  z-index: 5;
  width: 100%;
}
```

---

### 4. monthCalendarView

**Purpose**: Month overview for navigation and big-picture planning

**Input Props**:

```javascript
@api events: CalendarEvent[]
@api selectedDate: Date
```

**Key Features**:

- 7x6 grid (Sunday-Saturday columns, up to 6 weeks)
- Days from adjacent months in muted colors
- Event badges (max 3 visible, "+N more" link)
- Click date to jump to Day view
- Click "+N more" to expand day's events

---

### 5. dayCalendarView

**Purpose**: Single-day detailed view with arena breakdown

**Input Props**:

```javascript
@api events: CalendarEvent[]
@api selectedDate: Date
@api timeGranularity: 15 | 30 | 60
```

**Layout**:

- Left: Time slots
- Columns: One per arena with events today
- Event blocks with full details

---

### 6. ganttArenaView

**Purpose**: Arena utilization across season

**Input Props**:

```javascript
@api arenas: Arena[]
@api events: CalendarEvent[]
@api dateRange: { start: Date, end: Date }
@api zoomLevel: 'week' | 'month' | 'quarter'  // Controls block granularity
```

**Key Features**:

- Virtualized arena rows (only render visible)
- Timeline blocks represent time slots
- Utilization % bar per arena
- Hover for event details
- Scroll horizontally for full season view

---

### 7. eventDetailPanel

**Purpose**: Slide-out modal for viewing/editing event details

**Input Props**:

```javascript
@api event: CalendarEvent
@api isLoading: boolean
```

**Output Events**:

```javascript
dispatchEvent(new CustomEvent("close"));
dispatchEvent(new CustomEvent("edit")); // Opens full record
dispatchEvent(new CustomEvent("delete"));
```

**Features**:

- Slide in from right (position: fixed, right: 0)
- Semi-transparent overlay behind panel
- Click outside or X to close
- Shows full event details
- Action buttons (Edit, Delete, Export)

---

### 8. filterPanel

**Purpose**: Multi-filter control for events

**Input Props**:

```javascript
@api teams: Team[]
@api arenas: Arena[]
@api divisions: Division[]
@api selectedFilters: Object
```

**Output Events**:

```javascript
dispatchEvent(
  new CustomEvent("filterchange", {
    detail: { teams, eventTypes, arenas, divisions }
  })
);
```

**Features**:

- Collapsible panel
- Multi-select dropdowns with search
- Checkboxes for event types
- Clear button to reset
- Apply/Cancel buttons

---

## Service Layer Design

### CalendarService (Headless)

**Purpose**: All business logic without UI dependencies

**API**:

```javascript
export class CalendarService {
  constructor(leagueId) {
    this.leagueId = leagueId;
    this.cache = new Map(); // Cache events by date range
    this.subscribers = []; // Event listeners
  }

  // ===== Data Fetching =====

  async fetchEvents(startDate, endDate, filters = {}) {
    // Check cache first
    const cacheKey = `${startDate}-${endDate}-${JSON.stringify(filters)}`;
    if (this.cache.has(cacheKey) && !this.isCacheExpired(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Fetch from server
    const response = await CalendarController.getEventsByDateRange(
      startDate,
      endDate,
      filters.teams,
      filters.eventTypes,
      filters.arenas,
      filters.divisions
    );

    // Cache result
    this.cache.set(cacheKey, response.events);
    this.cache.set(`${cacheKey}-meta`, {
      timestamp: Date.now(),
      totalRecords: response.totalRecords
    });

    return response.events;
  }

  // ===== Time Slot Calculation =====

  generateTimeSlots(startDate, endDate, granularityMinutes = 15) {
    const slots = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      slots.push(new Date(current));
      current.setMinutes(current.getMinutes() + granularityMinutes);
    }

    return slots;
  }

  // ===== Event Management =====

  async rescheduleEvent(eventId, newStartDateTime, newDuration = null) {
    // Validate new time doesn't conflict
    const conflicts = await this.detectConflicts(eventId, newStartDateTime);

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts: conflicts,
        message: `This time conflicts with: ${conflicts.map((e) => e.Name).join(", ")}`
      };
    }

    // Update in Salesforce
    await CalendarController.updateEvent({
      id: eventId,
      startDateTime: newStartDateTime
    });

    // Invalidate cache
    this.clearCache();

    // Notify subscribers
    this.publish("eventRescheduled", { eventId, newStartDateTime });

    return { success: true };
  }

  async createEvent(eventData) {
    const { eventType, teams, arena, startDateTime, duration } = eventData;

    // Validation
    if (!this.isValidEventData(eventData)) {
      throw new Error("Invalid event data");
    }

    // Check availability
    const available = await this.checkArenaAvailability(
      arena,
      startDateTime,
      duration
    );
    if (!available) {
      throw new Error("Arena not available at this time");
    }

    // Create in Salesforce
    const newEvent = await CalendarController.createEvent(eventData);

    // Invalidate cache
    this.clearCache();

    // Notify subscribers
    this.publish("eventCreated", newEvent);

    return newEvent;
  }

  // ===== Conflict Detection =====

  async detectConflicts(
    eventId,
    startDateTime,
    duration = null,
    arenaId = null
  ) {
    const event = await this.getEventById(eventId);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const overlapping = await CalendarController.getConflictingEvents({
      eventId: eventId,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      arenaId: arenaId || event.Arena__c
    });

    return overlapping;
  }

  // ===== Filtering & Sorting =====

  filterEvents(events, filters = {}) {
    let result = [...events];

    if (filters.teams && filters.teams.length > 0) {
      result = result.filter(
        (e) =>
          filters.teams.includes(e.Team__c) ||
          filters.teams.includes(e.Home_Team__c) ||
          filters.teams.includes(e.Away_Team__c)
      );
    }

    if (filters.eventTypes && filters.eventTypes.length > 0) {
      result = result.filter((e) => filters.eventTypes.includes(e.type));
    }

    if (filters.arenas && filters.arenas.length > 0) {
      result = result.filter((e) => filters.arenas.includes(e.Arena__c));
    }

    if (filters.divisions && filters.divisions.length > 0) {
      result = result.filter((e) => filters.divisions.includes(e.Division__c));
    }

    return result;
  }

  // ===== Event Bus =====

  subscribe(event, callback) {
    this.subscribers.push({ event, callback });
  }

  unsubscribe(event, callback) {
    this.subscribers = this.subscribers.filter(
      (s) => !(s.event === event && s.callback === callback)
    );
  }

  publish(event, data) {
    this.subscribers
      .filter((s) => s.event === event)
      .forEach((s) => s.callback(data));
  }

  // ===== Cache Management =====

  clearCache() {
    this.cache.clear();
  }

  isCacheExpired(key, ttlSeconds = 300) {
    const meta = this.cache.get(`${key}-meta`);
    if (!meta) return true;
    return Date.now() - meta.timestamp > ttlSeconds * 1000;
  }
}
```

**Usage in Component**:

```javascript
// In calendarScheduler.js
connectedCallback() {
  this.calendarService = new CalendarService(this.leagueId);

  // Subscribe to events
  this.calendarService.subscribe('eventCreated', (event) => {
    this.loadEventsForDateRange(this.getWeekRange(this.selectedDate));
  });

  this.calendarService.subscribe('eventRescheduled', (data) => {
    this.showToast('Event rescheduled successfully');
    this.loadEventsForDateRange(this.getWeekRange(this.selectedDate));
  });

  // Initial load
  this.loadEventsForDateRange(this.getWeekRange(this.selectedDate));
}

async loadEventsForDateRange(startDate, endDate) {
  try {
    this.loading = true;
    const events = await this.calendarService.fetchEvents(
      startDate,
      endDate,
      this.filters
    );
    this.events = events;
  } catch (error) {
    this.error = error.message;
  } finally {
    this.loading = false;
  }
}
```

---

## Data Models & Interfaces

### CalendarEvent (Unified DTO)

```typescript
interface CalendarEvent {
  // Identifiers
  id: string;
  type: "Game" | "Practice" | "Tryout";
  recordType: "Game__c" | "Practice__c" | "Tryout__c";

  // Basic Info
  name: string;
  description?: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed";

  // Timing
  startDateTime: DateTime;
  endDateTime: DateTime;
  durationMinutes: number;

  // Location
  arenaId: string;
  arenaName: string;

  // Participants (context-dependent)
  teams?: Array<{
    id: string;
    name: string;
    role: "Home" | "Away" | "Primary"; // For Games vs others
  }>;
  divisionId?: string;
  divisionName?: string;

  // Game-specific
  homeScore?: number;
  awayScore?: number;
  homeTeamId?: string;
  awayTeamId?: string;

  // Roster (Practice/Tryout)
  rosterCount?: number;
  maxCapacity?: number;

  // Metadata
  createdBy?: string;
  createdDate?: DateTime;
  lastModified?: DateTime;

  // UI State (transient)
  isSelected?: boolean;
  isDragging?: boolean;
  hasConflict?: boolean;
}
```

### Filters

```typescript
interface CalendarFilters {
  teams?: string[]; // Team IDs
  eventTypes?: string[]; // 'Game', 'Practice', 'Tryout'
  arenas?: string[]; // Arena IDs
  divisions?: string[]; // Division IDs
  hidePastEvents?: boolean;
  showAllDayEvents?: boolean;
}
```

### Quick Create Payload

```typescript
interface QuickCreatePayload {
  eventType: "Game" | "Practice" | "Tryout";
  startDateTime: DateTime;
  durationMinutes: number;
  arenaId: string;

  // Depends on type
  homeTeamId?: string; // Game
  awayTeamId?: string; // Game
  teamId?: string; // Practice
  divisionId?: string; // Tryout
}
```

---

## Apex Controller Specifications

### CalendarController

```apex
public with sharing class CalendarController {

  /**
   * Get events for a date range with optional filters
   * Supports Games, Practices, and Tryouts
   *
   * @param startDate Start of date range
   * @param endDate End of date range
   * @param teamIds Filter to specific teams (null = all)
   * @param eventTypes Filter to event types ('Game', 'Practice', 'Tryout')
   * @param arenaIds Filter to specific arenas (null = all)
   * @param divisionIds Filter to specific divisions (null = all)
   * @return CalendarEventResponse with unified event list
   */
  @AuraEnabled(cacheable=false)
  public static CalendarEventResponse getEventsByDateRange(
      Date startDate,
      Date endDate,
      List<Id> teamIds,
      List<String> eventTypes,
      List<Id> arenaIds,
      List<Id> divisionIds
  ) {
    CalendarEventResponse response = new CalendarEventResponse();

    try {
      // Build dynamic WHERE clause based on filters
      String whereClause = buildWhereClause(startDate, endDate,
        teamIds, arenaIds, divisionIds);

      // Query Games
      if (eventTypes == null || eventTypes.contains('Game')) {
        List<CalendarEvent> games = getGameEvents(whereClause, teamIds, arenaIds);
        response.games.addAll(games);
      }

      // Query Practices
      if (eventTypes == null || eventTypes.contains('Practice')) {
        List<CalendarEvent> practices = getPracticeEvents(whereClause, teamIds, arenaIds);
        response.practices.addAll(practices);
      }

      // Query Tryouts
      if (eventTypes == null || eventTypes.contains('Tryout')) {
        List<CalendarEvent> tryouts = getTryoutEvents(whereClause, arenaIds, divisionIds);
        response.tryouts.addAll(tryouts);
      }

      // Combine and sort by date
      response.allEvents = new List<CalendarEvent>();
      response.allEvents.addAll(response.games);
      response.allEvents.addAll(response.practices);
      response.allEvents.addAll(response.tryouts);
      response.allEvents.sort();  // By startDateTime

      response.totalRecords = response.allEvents.size();
      response.success = true;

    } catch (Exception e) {
      response.success = false;
      response.errorMessage = e.getMessage();
    }

    return response;
  }

  /**
   * Reschedule an event to a new date/time
   * Performs conflict checking before update
   */
  @AuraEnabled
  public static void rescheduleEvent(Id eventId, DateTime newStartDateTime) {
    // CRUD check
    if (!eventId.getsobjecttype().getDescribe().isUpdateable()) {
      throw new AuraHandledException('You do not have permission to update events.');
    }

    // Get event type (Game, Practice, or Tryout)
    String sobjectType = eventId.getsobjecttype().getDescribe().getName();

    // Check for conflicts
    DateTime endDateTime = calculateEventEnd(eventId, newStartDateTime);
    List<SObject> conflicts = detectConflicts(eventId, newStartDateTime, endDateTime);

    if (!conflicts.isEmpty()) {
      throw new AuraHandledException(
        'This time conflicts with ' + conflicts.size() + ' existing event(s)'
      );
    }

    // Update
    SObject event = eventId.getsobjecttype().newInstance();
    event.put('Id', eventId);

    if (sobjectType == 'Game__c') {
      event.put('Game_DateTime__c', newStartDateTime);
    } else if (sobjectType == 'Practice__c') {
      event.put('Practice_DateTime__c', newStartDateTime);
    } else if (sobjectType == 'Tryout__c') {
      event.put('DateTime__c', newStartDateTime);
    }

    update event;
  }

  /**
   * Create new event from calendar quick create
   */
  @AuraEnabled
  public static CalendarEvent createEvent(Map<String, Object> eventData) {
    String eventType = (String) eventData.get('eventType');
    DateTime startDateTime = (DateTime) eventData.get('startDateTime');
    Integer durationMinutes = (Integer) eventData.get('durationMinutes');
    Id arenaId = (Id) eventData.get('arenaId');

    SObject newEvent;

    if (eventType == 'Game') {
      newEvent = new Game__c(
        Home_Team__c = (Id) eventData.get('homeTeamId'),
        Away_Team__c = (Id) eventData.get('awayTeamId'),
        Arena__c = arenaId,
        Game_DateTime__c = startDateTime
      );
    } else if (eventType == 'Practice') {
      newEvent = new Practice__c(
        Team__c = (Id) eventData.get('teamId'),
        Arena__c = arenaId,
        Practice_DateTime__c = startDateTime,
        Duration_Minutes__c = durationMinutes
      );
    } else if (eventType == 'Tryout') {
      newEvent = new Tryout__c(
        Division__c = (Id) eventData.get('divisionId'),
        Arena__c = arenaId,
        DateTime__c = startDateTime
      );
    }

    insert newEvent;

    // Return as CalendarEvent DTO
    return convertToCalendarEvent(newEvent);
  }

  /**
   * Detect conflicts for a time slot
   */
  @AuraEnabled
  public static List<CalendarEvent> getConflictingEvents(
      Id eventId,
      DateTime startDateTime,
      DateTime endDateTime,
      Id arenaId
  ) {
    // Query all events at the same arena during the time period
    List<Game__c> gameConflicts = [
      SELECT Id, Name, Game_DateTime__c, Home_Team__r.Name, Away_Team__r.Name
      FROM Game__c
      WHERE Arena__c = :arenaId
        AND Game_DateTime__c >= :startDateTime
        AND Game_DateTime__c < :endDateTime
        AND Id != :eventId
      LIMIT 10
    ];

    // Similar queries for Practice and Tryout...

    List<CalendarEvent> conflicts = new List<CalendarEvent>();
    for (Game__c game : gameConflicts) {
      conflicts.add(convertToCalendarEvent(game));
    }

    return conflicts;
  }

  // ===== Private Helper Methods =====

  private static String buildWhereClause(Date startDate, Date endDate,
      List<Id> teamIds, List<Id> arenaIds, List<Id> divisionIds) {
    // Dynamically build WHERE clause for queries
    String clause = '';

    if (startDate != null) {
      clause += ' AND startDateTime >= ' + DateTime.newInstance(startDate, Time.newInstance(0,0,0,0)).format();
    }

    if (endDate != null) {
      clause += ' AND startDateTime < ' + DateTime.newInstance(endDate.addDays(1), Time.newInstance(0,0,0,0)).format();
    }

    return clause;
  }

  private static List<CalendarEvent> getGameEvents(String whereClause,
      List<Id> teamIds, List<Id> arenaIds) {
    String query = 'SELECT Id, Home_Team__c, Home_Team__r.Name, Away_Team__c, ' +
      'Away_Team__r.Name, Arena__c, Arena__r.Name, Game_DateTime__c, Status__c ' +
      'FROM Game__c WHERE 1=1 ' + whereClause;

    if (teamIds != null && !teamIds.isEmpty()) {
      query += ' AND (Home_Team__c IN :teamIds OR Away_Team__c IN :teamIds)';
    }

    if (arenaIds != null && !arenaIds.isEmpty()) {
      query += ' AND Arena__c IN :arenaIds';
    }

    query += ' ORDER BY Game_DateTime__c ASC LIMIT 10000';

    List<CalendarEvent> events = new List<CalendarEvent>();
    for (Game__c game : Database.query(query)) {
      events.add(convertToCalendarEvent(game));
    }

    return events;
  }

  // Similar methods for Practice and Tryout...

  private static CalendarEvent convertToCalendarEvent(SObject record) {
    CalendarEvent event = new CalendarEvent();

    String recordType = record.getSobjectType().getDescribe().getName();

    if (recordType == 'Game__c') {
      Game__c game = (Game__c) record;
      event.id = game.Id;
      event.type = 'Game';
      event.name = game.Home_Team__r.Name + ' vs ' + game.Away_Team__r.Name;
      event.startDateTime = game.Game_DateTime__c;
      // ... populate other fields
    }
    // Similar for Practice and Tryout

    return event;
  }
}

/**
 * Response wrapper for calendar data
 */
public class CalendarEventResponse {
  @AuraEnabled public List<CalendarEvent> games = new List<CalendarEvent>();
  @AuraEnabled public List<CalendarEvent> practices = new List<CalendarEvent>();
  @AuraEnabled public List<CalendarEvent> tryouts = new List<CalendarEvent>();
  @AuraEnabled public List<CalendarEvent> allEvents = new List<CalendarEvent>();
  @AuraEnabled public Integer totalRecords = 0;
  @AuraEnabled public Boolean success = false;
  @AuraEnabled public String errorMessage;
}

/**
 * Unified calendar event DTO (matches interface from calendarService)
 */
public class CalendarEvent implements Comparable {
  @AuraEnabled public String id;
  @AuraEnabled public String type;
  @AuraEnabled public String name;
  @AuraEnabled public DateTime startDateTime;
  @AuraEnabled public DateTime endDateTime;
  @AuraEnabled public Integer durationMinutes;
  @AuraEnabled public String arenaId;
  @AuraEnabled public String arenaName;
  @AuraEnabled public String status;
  @AuraEnabled public Integer homeScore;
  @AuraEnabled public Integer awayScore;
  // ... more fields

  public Integer compareTo(Object o) {
    CalendarEvent other = (CalendarEvent) o;
    return this.startDateTime.compareTo(other.startDateTime);
  }
}
```

---

## Communication Patterns

### Event-Driven Architecture

```javascript
// Component -> Service communication
this.calendarService.rescheduleEvent(eventId, newDateTime);

// Service -> Component communication via events
this.calendarService.subscribe("eventRescheduled", (data) => {
  // Update UI
});

// Component -> Component communication
dispatchEvent(
  new CustomEvent("eventclick", {
    detail: event,
    bubbles: true, // Bubble up
    composed: true // Cross shadow DOM
  })
);
```

### Data Flow

```
User Interaction (click/drag)
    ↓
Component Handler Method
    ↓
Call CalendarService method
    ↓
CalendarService calls Apex
    ↓
Apex updates Salesforce
    ↓
CalendarService publishes event
    ↓
Component(s) subscribe and update
    ↓
Template re-renders
    ↓
UI Updated
```

---

## State Management

### Component State

```javascript
// calendarScheduler state
{
  currentView: 'week',
  selectedDate: Date,
  filters: CalendarFilters,
  events: CalendarEvent[],
  loading: boolean,
  error: string,
  showDetailPanel: boolean,
  selectedEvent: CalendarEvent,
  userPreferences: {
    timeGranularity: 15,
    showWeekends: true,
    theme: 'light'
  }
}
```

### Where State Lives

- **Global State** (in calendarScheduler):
  - Current view, selected date, main events list
  - Shared with all child components via @api

- **Local Component State** (in individual views):
  - Drag/drop state, quick create form state
  - Only relevant to that component

- **Service State** (in CalendarService):
  - Event cache, time slots
  - Shared data that may be needed by multiple components

---

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**
   - Only render visible time slots
   - Render buffer of +/- 2 slots for smooth scrolling

2. **Event Caching**
   - Cache events by date range
   - Prefetch adjacent weeks
   - Cache expiry: 5 minutes or on explicit clear

3. **Lazy Loading**
   - Load filter options on demand
   - Load arena list when Gantt view accessed
   - Paginate large lists

4. **Memoization**
   - Memoize getEventsForSlot() calculations
   - Cache time slot positions

5. **Debouncing**
   - Debounce filter changes (300ms)
   - Debounce window resize handlers

6. **Image Optimization**
   - Use SVG for icons
   - Lazy load images in event details

### Expected Performance

| Metric                      | Target      |
| --------------------------- | ----------- |
| Initial Load                | < 2 seconds |
| Event Load (fetch + render) | < 1 second  |
| Drag-drop response          | < 100ms     |
| Filter change               | < 500ms     |
| View switch                 | < 300ms     |
| Scroll (1000 items)         | 60 FPS      |

---

## Summary

This component architecture provides:

- **Modularity**: Each view is independent
- **Reusability**: CalendarService used across components
- **Testability**: Service layer has no UI dependencies
- **Performance**: Caching, virtual scrolling, lazy loading
- **Maintainability**: Clear responsibilities, well-defined interfaces

Next steps: Implement components in order of priority (Week view first, then Month, Day, Gantt).
