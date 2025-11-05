# Calendar Visual Mockups

## Overview

This document provides detailed visual mockups and wireframes for all calendar views. These mockups show the proposed layout, component positioning, and visual hierarchy for the refactored calendar system.

---

## 1. MONTH CALENDAR VIEW

### Full Page Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ☰  SportsForce | Calendar                                             🔔  👤  ⚙️     │  Header (SLDS)
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ◀ November 2025 ▶   [Today]   [📅 Date Picker ▼]   [Month][Week][Day][Gantt]         │  Navigation + View Selector
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Filters:  Team ▼(All) | Event Type ▼(All) | Arena ▼(All) | Division ▼(All)    │  │  Filter Panel (Collapsed/Expanded)
│  │ ✓ Games  ✓ Practices  ✓ Tryouts                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │        SUN       │       MON       │       TUE       │       WED       │ THU     │ │
│  ├──────────────────┼────────────────┼────────────────┼────────────────┼─────────┤ │
│  │  1 (Today)       │        2       │        3       │        4       │    5    │ │
│  │                  │  [G] Atoms AA  │                │  [G] Peewee AA │ [P]     │ │
│  │                  │                │                │  [P] Peewee    │ Atoms   │ │
│  │                  │                │                │                │         │ │
│  ├──────────────────┼────────────────┼────────────────┼────────────────┼─────────┤ │
│  │  8               │        9       │        10      │        11      │    12   │ │
│  │  [G] Atoms AA    │  [P]           │                │  [G] Bantam A  │ [G][P] │ │
│  │  [P] Peewee      │  [T] Atom Try  │                │  [T] Peewee    │ [G]    │ │
│  │  +1 more ▶       │                │                │                │ +2 ▶   │ │
│  │                  │                │                │                │         │ │
│  ├──────────────────┼────────────────┼────────────────┼────────────────┼─────────┤ │
│  │  15              │        16      │        17      │        18      │    19   │ │
│  │  [P]             │  [G] Atoms AA  │  [G] Bantam B  │  [P]           │ [G]     │ │
│  │  [G] Peewee AA   │  [P]           │                │  [G]           │ [P][P] │ │
│  │                  │                │                │                │         │ │
│  ├──────────────────┼────────────────┼────────────────┼────────────────┼─────────┤ │
│  │  22              │        23      │        24      │        25      │    26   │ │
│  │  [G] Atoms AA    │                │  [P]           │  [G] Peewee    │ [P]     │ │
│  │  vs Leafs        │                │  [G]           │                │ [T]     │ │
│  │                  │                │                │                │         │ │
│  └──────────────────┴────────────────┴────────────────┴────────────────┴─────────┘ │
│                                                                                          │
│  Legend:  [G] = Game (Blue)   [P] = Practice (Green)   [T] = Tryout (Orange)         │
│           Click any event to view details | Click "+N more" to see all events        │
│                                                                                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Month View Features

**Components**:

- **Navigation Bar**: Month/Year + Prev/Next buttons + Today button + Date Picker
- **View Selector**: Buttons to switch between Month/Week/Day/Gantt views
- **Filter Panel**: Multi-select dropdowns for Team, Event Type, Arena, Division
- **Calendar Grid**: 7-column grid showing Sun-Sat
- **Date Cells**:
  - Date number in top-left
  - Event badges below date
  - Shows first 3 events
  - "+N more ▶" link if >3 events
  - Light gray background for days from adjacent months
  - Yellow/light background for today

**Event Badge Styling**:

```
┌──────────────────┐
│ [G] Atoms AA     │  - Colored square (by event type)
│                  │  - Truncated event name
│ [P] Peewee       │  - Quick visual scan
│                  │
│ [T] +1 more ▶    │  - "+N more" link to expand
└──────────────────┘
```

### Month View Interactions

| Action                    | Behavior                                              |
| ------------------------- | ----------------------------------------------------- |
| **Click event badge**     | Open event detail panel (side-out)                    |
| **Click "+N more"**       | Expand cell to show all events + inline create option |
| **Click date number**     | Jump to Day view for that date                        |
| **Hover event**           | Tooltip: Full event name + time                       |
| **Drag event**            | Not supported in Month view (switch to Week/Day)      |
| **Click filter dropdown** | Multi-select UI (checkboxes with search)              |

---

## 2. WEEK CALENDAR VIEW (PRIMARY)

### Full Page Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│  ☰  SportsForce | Calendar                                                🔔  👤  ⚙️      │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ◀ Week of Nov 3-9, 2025 ▶   [Today]   [📅 Picker ▼]   [Month][Week][Day][Gantt]        │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Filters: Team ▼ Atoms AA | EventType ▼ All | Arena ▼ All | Div ▼ All   [Clear]    │  │
│  │ Active: Team filtered to "Atoms AA"  ✓ Hide past events                           │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │  Time    │ Mon 3    │ Tue 4    │ Wed 5    │ Thu 6    │ Fri 7    │ Sat 8    │ Sun 9│  │
│  │ (Sticky) │ (Sticky) │          │          │          │          │          │      │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────┤  │
│  │ 7:00 AM  │          │          │          │          │          │          │      │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────┤  │
│  │ 7:15 AM  │          │          │          │          │          │ ╔═══════╗│      │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ ║ [G]   ║│      │  │
│  │ 7:30 AM  │          │          │          │          │          │ ║ Atoms ║│      │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ ║ AA    ║│      │  │
│  │ 7:45 AM  │          │          │          │          │          │ ║ vs    ║│      │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ ║Leafs  ║│      │  │
│  │ 8:00 AM  │ ╔══════╗ │          │ ╔══════╗ │          │ ╔══════╗ │ ║       ║│      │  │
│  │          │ ║[P]   ║ │          │ ║[G]   ║ │          │ ║[P]   ║ │ ║Cinci  ║│      │  │
│  ├──────────┤ ║Atoms ║ ├──────────┤ ║Atoms ║ ├──────────┤ ║Peewee║ │ ║Arena  ║│      │  │
│  │ 8:30 AM  │ ║Pract ║ │          │ ║AA    ║ │          │ ║Pract ║ │ ║       ║│      │  │
│  ├──────────┤ ║      ║ ├──────────┤ ║vs    ║ ├──────────┤ ║      ║ │ ║Score: ║│      │  │
│  │ 9:00 AM  │ ║(60 m)║ │          │ ║Leafs ║ │          │ ║(60 m)║ │ ║4-1   ║│      │  │
│  │          │ ║      ║ │          │ ║      ║ │          │ ║      ║ │ ║       ║│      │  │
│  ├──────────┤ ║Cinci ║ ├──────────┤ ║      ║ ├──────────┤ ║Arena2║ │ ║Cinci  ║│      │  │
│  │ 9:30 AM  │ ║Arena ║ │          │ ║Cinci ║ │          │ ║      ║ │ ║(80 m) ║│      │  │
│  │          │ ╚══════╝ │          │ ║Arena ║ │          │ ╚══════╝ │ ║       ║│      │  │
│  ├──────────┼──────────┼──────────┼──────────┤ ║      ║ ├──────────┼────────┘│      │  │
│  │10:00 AM  │          │ ╔══════╗ │ ║      ║ │          │          │         │      │  │
│  │          │          │ ║[T]   ║ │ ║      ║ │          │          │         │      │  │
│  ├──────────┼──────────┤ ║Atom  ║ │ ║(80m) ║ ├──────────┼──────────┼─────────┼──────┤  │
│  │10:30 AM  │          │ ║Tryout║ │ ╚══════╝ │          │          │         │      │  │
│  │          │          │ ║      ║ │          │          │          │         │      │  │
│  ├──────────┼──────────┤ ║Metro ║ ├──────────┼──────────┼──────────┼─────────┼──────┤  │
│  │11:00 AM  │          │ ║Arena ║ │          │          │          │         │      │  │
│  │          │          │ ║      ║ │          │          │          │         │      │  │
│  │          │          │ ║(60m) ║ │          │          │          │         │      │  │
│  │          │          │ ╚══════╝ │          │          │          │         │      │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────┘  │
│                                                                                             │
│  ⬤ Current Time Line (shown in red for "right now")                                      │
│  Legend: [G]=Game(Blue) [P]=Practice(Green) [T]=Tryout(Orange) | Click event to edit     │
│          Drag events to reschedule | Click empty slot to create new event                │
│                                                                                             │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Week View Details - Time Grid

```
TIME COLUMN (Left, Sticky)          DAY COLUMNS (Scrollable)
┌──────────┐                        ┌────────────────────────────────────────┐
│          │                        │ MON 3 | TUE 4 | WED 5 | THU 6 | ...   │
├──────────┤                        ├────────────────────────────────────────┤
│ 7:00 AM  │  ← Pale gray bg       │ ░░░░░░┃░░░░░░┃░░░░░░┃░░░░░░┃ (empty)│
├──────────┤     (15-min slot)      ├────────────────────────────────────────┤
│ 7:15 AM  │                        │       ┃       ┃       ┃       ┃       │
├──────────┤                        ├────────────────────────────────────────┤
│ 7:30 AM  │  ← Darker gray bg     │       ┃       ┃       ┃ ┌───┐ ┃       │
│          │     (visual scan)      │       ┃       ┃       ┃ │[G]│ ┃       │
├──────────┤                        ├────────────────────────────────────────┤
│ 7:45 AM  │                        │       ┃       ┃       ┃ │AA │ ┃       │
├──────────┤  ← User's "now" is    │       ┃       ┃       ┃ │vs │ ┃       │
│ 8:00 AM  │    usually here        │ ┌────┐┃       ┃ ┌────┐┃ │Leafs┃       │
│          │                        │ │[P]│┃       ┃ │[G]│┃ │    │ ┃       │
├──────────┤  Red line shows        │ │Pra┃ ┃       ┃ │AA │┃ └────┘ ┃       │
│ 8:30 AM  │  "current time"        │ │   │┃       ┃ │vs ┃┃        ┃       │
├──────────┤                        │ └────┘┃       ┃ │Leafs       ┃       │
│ 9:00 AM  │                        │       ┃       ┃ │    │       ┃       │
├──────────┤                        ├───────┃───────┃─┴────┴───────┃───────┤
│ 9:30 AM  │                        │       ┃       ┃ ┌──────────┐ ┃       │
├──────────┤                        │       ┃       ┃ │[T] Atom  │ ┃       │
│10:00 AM  │                        │       ┃       ┃ │Tryout    │ ┃       │
│          │                        │       ┃       ┃ │Metro     │ ┃       │
├──────────┤                        │       ┃ ┌────┐┃ │Arena     │ ┃       │
│10:30 AM  │                        │       ┃ │[T]│┃ │(60 min)  │ ┃       │
│          │                        │       ┃ │    │┃ └──────────┘ ┃       │
├──────────┤                        │       ┃ │    │┃              ┃       │
│11:00 AM  │                        │       ┃ │    │┃              ┃       │
└──────────┘                        └───────┃─┴────┴┃──────────────┃───────┘
```

### Week View - Event Block Styling

**Normal Event**:

```
┌─────────────────────┐
│ [G] Atoms AA        │  ← Colored left border (by event type)
│                     │  ← Event name (truncated if needed)
│ vs Leafs            │  ← Team names or detail
│                     │  ← Lighter text: location/status
│ Cinci Arena         │
│                     │  ← Height = duration / 15-min-slot-height
│ (80 minutes)        │  ← Shows duration for quick reference
└─────────────────────┘
Color: Blue (#0076D6) for Games
```

**Hover State**:

```
┌─────────────────────┐
│ [G] Atoms AA        │  ← Shadow appears (elevation)
│                     │  ← Cursor: pointer
│ vs Leafs            │  ← Background slightly darker
│                     │  ← Tooltip: "Click to view | Drag to reschedule"
│ Cinci Arena         │
└─────────────────────┘
```

**Dragging State**:

```
┌─────────────────────┐
│ [G] Atoms AA        │  ← Opacity: 0.7 (semi-transparent)
│                     │  ← Transform: scale(1.05) or shadow expanding
│ vs Leafs            │  ← Shows "time preview": "8:30 PM - 9:50 PM"
│                     │  ← Following cursor
│ Cinci Arena         │
└─────────────────────┘
```

**Drop Target**:

```
┌─────────────────────┐
│ ✓ 8:30 PM Wed 5     │  ← Green background or dashed border
│                     │  ← Shows where event will land
│ 1 hour 20 minutes   │  ← Checkmark icon
│                     │
└─────────────────────┘
```

**Conflict Detected**:

```
┌─────────────────────┐
│ ⚠️ CONFLICT!        │  ← Red border
│                     │  ← Warning icon
│ Arena already       │  ← Conflict message
│ booked: Peewee      │  ← Show conflicting event
│                     │  ← "Drop anyway?" option
└─────────────────────┘
```

### Week View - Quick Create Form

When user clicks empty time slot:

```
┌───────────────────────────────────────────┐
│ ✓ Thu 6, 8:00 PM (15 min slot selected)   │  ← Pre-filled date/time
├───────────────────────────────────────────┤
│ Event Type: [Game        ▼]                │  ← Select: Game/Practice/Tryout
├───────────────────────────────────────────┤
│ Team/Division:                            │
│ [Select Team/Division  ▼]                 │  ← Depends on event type
│                                            │
│ Arena: [Cinci Arena     ▼]                │  ← All available arenas
├───────────────────────────────────────────┤
│ Duration: [60 mins      ▼]                │  ← 15/30/60/90/120 min options
├───────────────────────────────────────────┤
│ ⚠️ Conflict detected: Atoms AA already     │  ← Validation/conflict warning
│    has event 8:00-9:20 PM                │
├───────────────────────────────────────────┤
│ [Cancel]  [Create & Edit]  [Quick Save]   │  ← Action buttons
└───────────────────────────────────────────┘
```

### Week View Features

| Feature                    | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| **Time Column**            | Sticky left column, 15-min increments, alternating background |
| **Day Headers**            | Day name + date, sticky top row, highlight current day        |
| **Current Time Indicator** | Red horizontal line showing "now"                             |
| **Event Blocks**           | Height = duration / slot-height, colored by event type        |
| **Drag-Drop**              | Reschedule events to new time/day, snap to grid               |
| **Quick Create**           | Click empty slot to create event                              |
| **Filtering**              | Applied at service level, shows only matching events          |
| **Scrolling**              | Horizontal scroll for day columns, vertical scroll for time   |

### Week View Interactions

| Action                    | Behavior                                                  |
| ------------------------- | --------------------------------------------------------- |
| **Drag event**            | Semi-transparent, show time preview, snap to grid on drop |
| **Drop in conflict zone** | Show warning, allow override                              |
| **Click event**           | Open detail panel (side-out)                              |
| **Click empty slot**      | Inline quick-create form appears                          |
| **Hover time slot**       | Show time + availability status                           |
| **Prev/Next week**        | Animate slide-in from left/right                          |
| **Click date picker**     | Open calendar popup, jump to selected week                |
| **Escape key**            | Close detail panel or cancel quick-create                 |

---

## 3. DAY CALENDAR VIEW

### Full Page Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ☰  SportsForce | Calendar                                              🔔  👤  ⚙️     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ◀ Thursday, November 6, 2025 ▶   [Today]   [📅 Picker ▼]  [Month][Week][Day][Gantt] │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Filters: Team ▼ All | EventType ▼ All | Arena ▼ All | Div ▼ All               │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌───────┬──────────────────────┬──────────────────────┬──────────────────────┐       │
│  │ Time  │ Cinci Arena          │ Metro Arena          │ West Ice             │       │
│  │       │ (Highest Usage)      │ (Medium Usage)       │ (Low Usage)          │       │
│  ├───────┼──────────────────────┼──────────────────────┼──────────────────────┤       │
│  │ 7:00  │                      │                      │                      │       │
│  │ AM    │                      │                      │                      │       │
│  ├───────┼──────────────────────┼──────────────────────┼──────────────────────┤       │
│  │       │                      │                      │                      │       │
│  │ 7:30  │  ╔═════════════════╗ │                      │                      │       │
│  │ AM    │  ║ [G] Atoms AA    ║ │                      │                      │       │
│  │       │  ║ vs Leafs        ║ │                      │                      │       │
│  ├───────┤  ║                 ║ ├──────────────────────┼──────────────────────┤       │
│  │ 8:00  │  ║ Start: 7:30 AM  ║ │  ╔═════════════════╗ │                      │       │
│  │ AM    │  ║ Duration: 80 min ║ │  ║ [P] Peewee     ║ │                      │       │
│  │       │  ║                 ║ │  ║ Practice       ║ │                      │       │
│  ├───────┤  ║ Status: In Prog ║ ├──║                ║─┼──────────────────────┤       │
│  │ 8:30  │  ║                 ║ │  ║ Start: 8:00 AM║ │                      │       │
│  │ AM    │  ║ Home: 2          ║ │  ║ Duration: 60m ║ │                      │       │
│  │       │  ║ Away: 1          ║ │  ║                ║ │                      │       │
│  ├───────┤  ╚═════════════════╝ ├──╚═════════════════╝ ├──────────────────────┤       │
│  │ 9:00  │                      │                      │  ╔═════════════════╗ │       │
│  │ AM    │                      │  ╔═════════════════╗ │  ║ [T] Atom       ║ │       │
│  │       │                      │  ║ [T] Atom       ║ │  ║ Tryout         ║ │       │
│  ├───────┼──────────────────────┤  ║ Tryout         ║ ┼──║                ║─┤       │
│  │ 9:30  │                      │  ║                ║ │  ║ Start: 9:00 AM║ │       │
│  │ AM    │                      │  ║ Start: 9:00 AM ║ │  ║ Duration: 90m ║ │       │
│  │       │                      │  ║ Duration: 60 m ║ │  ║                ║ │       │
│  ├───────┼──────────────────────┤  ║                ║ ├──╚═════════════════╝ ┤       │
│  │10:00  │                      │  ║ Max: 80        ║ │                      │       │
│  │ AM    │                      │  ║ Registered: 42 ║ │                      │       │
│  ├───────┼──────────────────────┤  ╚═════════════════╝ ├──────────────────────┤       │
│  │10:30  │                      │                      │                      │       │
│  │ AM    │                      │                      │                      │       │
│  │       │                      │                      │                      │       │
│  └───────┴──────────────────────┴──────────────────────┴──────────────────────┘       │
│                                                                                         │
│  ℹ️  Double-click event to edit | Drag to reschedule | Right-click for more options   │
│                                                                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Day View Details - Multi-Arena Layout

```
ARENA COLUMNS (Based on arenas with events today)

┌──────────────┬─────────────────────┬─────────────────────┐
│ Time (Sticky)│ Cinci Arena         │ Metro Arena         │
├──────────────┼─────────────────────┼─────────────────────┤
│              │ ┌─────────────────┐ │                     │
│ 7:00 AM      │ │ [G] Atoms AA    │ │                     │
│              │ │ vs Leafs        │ │                     │
│ 7:30 AM      │ │                 │ │                     │
│              │ │ Cinci Arena     │ │                     │
│              │ │ 7:30 - 8:50 PM  │ │                     │
│ 8:00 AM      │ │                 │ │                     │
│              │ │ Status: Sched   │ │ ┌─────────────────┐ │
│ 8:30 AM      │ │                 │ │ │ [P] Peewee     │ │
│              │ │                 │ │ │ Practice       │ │
│ 9:00 AM      │ │                 │ │ │                 │ │
│              │ └─────────────────┘ │ │ 8:00 - 9:00 AM  │ │
│ 9:30 AM      │                     │ │                 │ │
│              │                     │ │ Cinci Arena     │ │
│ 10:00 AM     │                     │ │                 │ │
│              │                     │ └─────────────────┘ │
│ 10:30 AM     │                     │                     │
│              │                     │ ┌─────────────────┐ │
│ 11:00 AM     │                     │ │ [T] Atom Tryout │ │
└──────────────┴─────────────────────┴─────────────────────┘
```

### Day View Features

| Feature           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| **Arena Columns** | Separate column for each arena with events today      |
| **Time Rows**     | Same 15-min grid as Week view                         |
| **Event Details** | More readable, shows full event info                  |
| **Arena Stats**   | Shows usage % for each arena (optional)               |
| **Drag-Drop**     | Reschedule within same day OR move to different arena |
| **Quick Create**  | Click empty slot to create event                      |
| **Detail Panel**  | Click event to open detail panel                      |

---

## 4. ARENA UTILIZATION GANTT VIEW

### Full Page Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ☰  SportsForce | Calendar                                              🔔  👤  ⚙️     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  Arena Utilization - Season 2025-2026   [Zoom: Month ▼] [Filters ▼]                   │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Division: [All ▼]   Team: [All ▼]   Date Range: Oct 2025 - Mar 2026   [Update] │  │
│  │ Show: ✓ Games  ✓ Practices  ✓ Tryouts   ✓ Maintenance Blocks                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌─────────────────────┬─────────────────────────────────────────────────────────────┐ │
│  │ Arena (Sticky Left) │ October          November           December              │ │
│  │ (Utilization)       │ ├─ ┤ ├─ ┤ ├─ ┤  ├─ ┤ ├─ ┤ ├─ ┤   ├─ ┤ ├─ ┤ ├─ ┤        │ │
│  │                     │ W1 W2 W3 W4 W1  W2 W3 W4 W5  W1 W2 W3                      │ │
│  ├─────────────────────┼─────────────────────────────────────────────────────────────┤ │
│  │ Cinci Arena         │ [G][G][P][T]│[  ][G][G][G] │[G][P][  ]    98% 85% 75%     │ │
│  │ (Bookings: 127/130) │ [G][G][G][G]│[G][G][G][G] │[G][G][G]     ▓▓▓▓▓▓▓▓░░      │ │
│  │                     │ [P][  ][P][P]│[  ][  ][P][  ]│[P][  ][G]    ▓▓▓▓▓▓▓░░░░    │ │
│  ├─────────────────────┼─────────────────────────────────────────────────────────────┤ │
│  │ Metro Arena         │ [  ][G][G][  ]│[G][G][G][  ] │[  ][  ][G]   52% 65% 48%    │ │
│  │ (Bookings: 68/130)  │ [G][T][G][  ]│[  ][  ][  ][  ]│[G][T][G]    ▓▓▓▓▓▓░░░░░░  │ │
│  │                     │ [  ][  ][  ][  ]│[G][T][  ][G] │[  ][  ][  ]  ▓▓▓▓▓░░░░░░░  │ │
│  ├─────────────────────┼─────────────────────────────────────────────────────────────┤ │
│  │ West Ice           │ [G][  ][  ][G]│[G][G][G][  ] │[  ][  ][  ]   42% 60% 38%   │ │
│  │ (Bookings: 54/130) │ [  ][  ][  ][  ]│[  ][  ][  ][  ]│[G][G][  ]   ▓▓▓▓▓░░░░░░░  │ │
│  │                     │ [P][T][  ][  ]│[  ][G][  ][  ] │[  ][  ][  ]   ▓▓▓▓░░░░░░░░ │ │
│  ├─────────────────────┼─────────────────────────────────────────────────────────────┤ │
│  │ North Rink         │ [  ][  ][  ][  ]│[  ][  ][  ][  ] │[  ][  ][  ]   12% 18% 8%  │ │
│  │ (Bookings: 18/130) │ [  ][T][  ][  ]│[G][  ][  ][  ] │[  ][  ][T]   ▓░░░░░░░░░░  │ │
│  │                     │ [  ][  ][  ][  ]│[  ][  ][T][  ] │[  ][  ][  ]   ▓░░░░░░░░░░  │ │
│  └─────────────────────┴─────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  Legend: [G]=Game [P]=Practice [T]=Tryout   Filled=Booked  Empty=Available             │
│          Color intensity shows utilization %  Hover for details  Click to view event   │
│                                                                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Gantt View - Detailed Arena Block

```
ZOOMED VIEW - Each week shows individual time slots

┌──────────────────────────────────────────────────────┐
│ Cinci Arena - Week of Nov 3-9, 2025                │
├──────────────┬──────────┬──────────┬──────────┬─────┤
│ Day          │ Nov 3    │ Nov 4    │ Nov 5    │ ...│
├──────────────┼──────────┼──────────┼──────────┼─────┤
│ Slot 1       │ ✓ [G]    │ ✓ [P]    │ ✓ [G]    │     │  ← Available slots represented
│ (7:00-8:00)  │ Atoms AA │ Peewee   │ Atoms AA │     │     as [G]/[P]/[T] or blank
│              │          │          │ vs Leafs │     │     for empty
├──────────────┼──────────┼──────────┼──────────┼─────┤
│ Slot 2       │ ✓ [G]    │ ✓ [G]    │ ✓ [G]    │     │
│ (8:00-9:00)  │ Atoms AA │ Bantam A │ Peewee   │     │
│              │ vs Leafs │          │          │     │
├──────────────┼──────────┼──────────┼──────────┼─────┤
│ Slot 3       │ ✓ [P]    │ ✓ [T]    │          │     │
│ (9:00-10:00) │ Peewee   │ Atom Try │          │     │
├──────────────┼──────────┼──────────┼──────────┼─────┤
│ Slot 4       │          │          │ ✓ [P]    │     │
│ (10:00-11:00)│          │          │ Peewee   │     │
└──────────────┴──────────┴──────────┴──────────┴─────┘
```

### Gantt View - Utilization Bar

```
UTILIZATION VISUALIZATION

Arena Name        Utilization %   Visual Bar
─────────────────────────────────────────────
Cinci Arena       98%            ▓▓▓▓▓▓▓▓▓▓ (almost full)
Metro Arena       65%            ▓▓▓▓▓▓░░░░ (medium)
West Ice          42%            ▓▓▓▓░░░░░░ (light)
North Rink        12%            ▓░░░░░░░░░ (very light)

Color:
- Filled (▓) = Dark green or brand color (booked)
- Empty (░) = Light gray (available)
- Total blocks = number of time slots in date range
```

### Gantt View Features

| Feature                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| **Arena Rows**          | Each row = one arena (left side sticky)             |
| **Timeline Blocks**     | Small squares representing time slots               |
| **Color by Event Type** | [G]=Blue, [P]=Green, [T]=Orange or letter indicator |
| **Utilization %**       | Shows % booked per arena for date range             |
| **Zoom Levels**         | Week/Month/Quarter view (changes block granularity) |
| **Horizontal Scroll**   | See full season timeline                            |
| **Filters**             | Filter by division, team, event type                |
| **Hover Tooltip**       | Shows event details for each block                  |
| **Click Block**         | Open event detail panel                             |

---

## 5. EVENT DETAIL PANEL (Shared across all views)

### Panel Layout

```
SIDE PANEL - Slides in from right, semi-transparent overlay

┌──────────────────────────────────────────────────┐
│ ✕                                                │  ← Close button (top-right)
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ [G]  GAME                                 │   │  ← Event type badge + label
│  └──────────────────────────────────────────┘   │
│                                                   │
│  Atoms AA vs Leafs                              │  ← Event title
│                                                   │
│  📅 Thursday, November 6, 2025                  │  ← Date
│  🕐 7:30 PM - 8:50 PM (80 minutes)               │  ← Time + duration
│  📍 Cinci Arena                                  │  ← Location
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ Status: In Progress                      │   │  ← Status badge
│  │ Home Score: 4  |  Away Score: 1          │   │  ← Game-specific info
│  └──────────────────────────────────────────┘   │
│                                                   │
│  📋 Details                                      │  ← Expandable sections
│  ├─ Division: Atom AA                           │
│  ├─ League: Ontario Hockey                      │
│  └─ Created: Oct 15, 2025 by Admin User         │
│                                                   │
│  👥 Roster (3/15 registered)                     │  ← Practice/Tryout specific
│  ├─ Player 1                                    │
│  ├─ Player 2                                    │
│  └─ ...                                         │
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ 📝 Edit  🗑️ Delete  📤 Export            │   │  ← Action buttons
│  └──────────────────────────────────────────┘   │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Detail Panel - Minimal Version (View Only)

```
Quick view without edit options:

┌──────────────────────────────────────────┐
│ [P] PRACTICE                             │  ← Brief, read-only view
├──────────────────────────────────────────┤
│ Peewee Practice                          │
│ Thu, Nov 6 | 8:00 - 9:00 PM              │
│ Cinci Arena                              │
│                                          │
│ Status: Scheduled                        │
│ Roster: 14/18 players attending          │
│                                          │
│ [Edit] [Close]                           │
└──────────────────────────────────────────┘
```

### Detail Panel - Full Edit Version

Clicking "Edit" opens full record in Salesforce (not inline editing in panel).

---

## 6. FILTER PANEL

### Expanded Filter Panel

```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Filters                                           [Reset] │  ← Collapse/reset
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Team                                                        │
│ ☐ All Teams                                                │  ← Multi-select
│ ☑ Atoms AA                                                 │     checkboxes
│ ☐ Atoms A                                                  │
│ ☐ Atoms B                                                  │
│ ☐ Peewee AA                                                │
│ ☐ Peewee A                                                 │
│ ☐ Bantam A                                                 │
│ [Search teams...]      ← Search box for long lists         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Event Type                                                  │
│ ☑ Games         ← Most important filters are checked by   │
│ ☑ Practices       default                                  │
│ ☑ Tryouts                                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Arena                                                       │
│ ☐ All Arenas                                               │
│ ☑ Cinci Arena                                              │
│ ☑ Metro Arena                                              │
│ ☐ West Ice                                                 │
│ ☐ North Rink                                               │
│ [Search arenas...]                                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Division                                                    │
│ ☐ All Divisions                                            │
│ ☑ Atom                                                     │
│ ☐ Peewee                                                   │
│ ☐ Bantam                                                   │
│ ☐ Midget                                                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ☑ Hide past events       ← Additional options              │
│ ☐ Show all-day events                                       │
│                                                              │
│ [Cancel] [Apply Filters]  ← Action buttons                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. COLOR & STYLING REFERENCE

### Event Type Colors

```
Games       ▓▓▓▓▓▓▓   #0076D6   Salesforce Blue
            (Primary event type)

Practices   ▓▓▓▓▓▓▓   #3DB88D   Salesforce Green
            (Training/preparation)

Tryouts     ▓▓▓▓▓▓▓   #F5A623   Salesforce Orange
            (Evaluation events)
```

### Status Indicators

```
Scheduled   ▢ White bg, dark border
In Progress ⦿ Blue bg (active)
Completed   ✓ Gray bg, checkmark
Cancelled   ✗ Red bg with strikethrough
```

### Component States

```
Normal      │ Solid color + text overlay
Hover       │ Darker shade + shadow + cursor:pointer
Active      │ Border highlight + checkmark
Dragging    │ 70% opacity + elevated shadow
Drop Target │ Green dashed border + checkmark
Conflict    │ Red border + warning icon
```

---

## 8. RESPONSIVE BEHAVIOR (Desktop-Focused)

### Viewport Breakpoints

```
Desktop (1024px+)
├─ Month view:  Full grid layout
├─ Week view:   7-day columns (or 5-day Mon-Fri)
├─ Day view:    Multi-arena columns
└─ Gantt view:  Scrollable timeline

Small Desktop (1024-1280px)
├─ Week view:   May scroll horizontally for 7 days
├─ Gantt view:  Definitely scrollable
└─ Filters:     May collapse to dropdowns

Large Desktop (1920px+)
├─ Week view:   Spacious, more event details visible
├─ Gantt view:  Show more time periods at once
└─ Side panel:  Wider, more readable
```

### Mobile Behavior (Hidden)

- Calendar fully hidden on mobile (<1024px)
- Show message: "Calendar view is not supported on mobile"
- Provide alternative: List view or agenda view (future enhancement)

---

## 9. VISUAL HIERARCHY & UX PRINCIPLES

### Information Hierarchy

1. **Event Name** - Largest, most prominent
2. **Team Names** - Secondary, identifies participants
3. **Time & Location** - Tertiary, contextual info
4. **Status/Score** - Quaternary, status info

### Visual Cues

| Need                   | Solution                                  |
| ---------------------- | ----------------------------------------- |
| Quick identification   | Color-coded event type badges             |
| Understanding duration | Event block height proportional to time   |
| Current time context   | Red horizontal line showing "now"         |
| Interactions available | Hover states + cursor changes             |
| Conflicts/issues       | Red borders + warning icons               |
| Filtering active       | Blue text or badge showing active filters |

### Accessibility Principles

- **Color + Text**: Don't rely on color alone
- **Contrast**: 4.5:1 minimum for text, 3:1 for graphics
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: All features accessible via keyboard
- **ARIA Labels**: Descriptive labels for screen readers
- **Motion**: Smooth but not distracting animations

---

## Summary Table - All Views at a Glance

| View      | Primary Use          | Granularity  | Interactions                  | Best For                            |
| --------- | -------------------- | ------------ | ----------------------------- | ----------------------------------- |
| **Month** | Overview, navigation | Days         | Click event, navigate         | Big-picture planning, finding dates |
| **Week**  | Detailed scheduling  | 15-min slots | Drag-drop, create, reschedule | Main scheduling interface           |
| **Day**   | Ultra-detailed       | 15-min slots | Drag-drop, create             | Fine-tuning schedules               |
| **Gantt** | Arena utilization    | Week/Month   | Hover, click, filter          | Finding available arenas            |

---

## Next Steps

1. **Visual Design Review**: Share these mockups for stakeholder feedback
2. **Component Breakdown**: Identify which mockups need high-fidelity designs
3. **Prototype Development**: Create clickable prototypes for user testing
4. **Technical Specification**: Define exact CSS/styling for each component
5. **Accessibility Review**: WCAG 2.1 AA compliance for all views
