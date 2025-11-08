import { LightningElement, api } from "lwc";

/**
 * ganttArenaView
 *
 * Arena utilization Gantt chart showing availability across timeline
 *
 * Features:
 * - Rows for each arena (sticky left)
 * - Timeline blocks for time slots
 * - Zoom levels (week, month, quarter)
 * - Utilization % per arena
 * - Event type indicators (G/P/T)
 * - Hover tooltips with event details
 * - Filtering by division, team, event type
 *
 * Input Props:
 * @api currentDate - Date to center timeline on
 * @api events - Array of calendar events
 * @api selectedFilters - Filter state {teams, eventTypes, arenas, divisions}
 * @api zoomLevel - 'week' or 'month'
 *
 * Output Events:
 * @fires eventclick - When an event block is clicked
 */

export default class GanttArenaView extends LightningElement {
  // ===== API PROPERTIES =====

  _currentDate = new Date();

  @api
  get currentDate() {
    return this._currentDate;
  }

  set currentDate(value) {
    if (value) {
      this._currentDate = value;
      this.updateGanttData();
    }
  }

  @api
  get events() {
    return this._events;
  }

  set events(value) {
    this._events = value || [];
    this.updateGanttData();
  }

  _events = [];

  _selectedFilters = {
    teams: [],
    eventTypes: [],
    arenas: [],
    divisions: []
  };

  @api
  get selectedFilters() {
    return this._selectedFilters;
  }

  set selectedFilters(value) {
    if (value) {
      this._selectedFilters = {
        teams: value.teams || [],
        eventTypes: value.eventTypes || [],
        arenas: value.arenas || [],
        divisions: value.divisions || []
      };
      this.updateGanttData();
    }
  }

  _zoomLevel = "day";

  @api
  get zoomLevel() {
    return this._zoomLevel;
  }

  set zoomLevel(value) {
    if (value) {
      this._zoomLevel = value;
      this.updateGanttData();
    }
  }

  // ===== CONSTANTS =====

  static ZOOM_LEVELS = {
    day: { label: "Day", hours: 18, blockType: "hour" },
    week: { label: "Week", days: 7, blockType: "day" }
  };

  // ===== INTERNAL STATE =====

  arenaRows = [];
  timelineBlocks = [];
  timelineLabels = [];
  visibleArenas = [];
  currentDayIndex = -1; // -1 means today is not in the visible range
  currentTimeInterval = null; // Interval for updating current time indicator

  // ===== COMPUTED PROPERTIES =====

  get ganttTitle() {
    if (this.isDayZoom) {
      // Day view: show the specific date
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      };
      return this.currentDate.toLocaleDateString("en-US", options);
    }
    // Week view: show week range
    return this._getWeekRangeDisplay(this.currentDate);
  }

  /**
   * Get formatted week range display (e.g., "Nov 4 - Nov 10, 2025")
   * @private
   */
  _getWeekRangeDisplay(date) {
    const weekStart = this._getWeekStartDate(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

    const startMonth = weekStart.toLocaleDateString("en-US", {
      month: "short"
    });
    const startDay = weekStart.getDate();
    const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
    const endDay = weekEnd.getDate();
    const year = weekEnd.getFullYear();

    // Always show both month names for consistency
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  /**
   * Get the Monday of the week containing the given date
   * @private
   */
  _getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);
    return new Date(d);
  }

  get isDayZoom() {
    return this.zoomLevel === "day";
  }

  get isWeekZoom() {
    return this.zoomLevel === "week";
  }

  get dayZoomVariant() {
    return this.isDayZoom ? "brand" : "neutral";
  }

  get weekZoomVariant() {
    return this.isWeekZoom ? "brand" : "neutral";
  }

  isCurrentDayBlock(blockIndex) {
    return blockIndex === this.currentDayIndex;
  }

  /**
   * Show current time indicator only in day view when viewing today
   */
  get showCurrentTimeIndicator() {
    if (!this.isDayZoom) {
      return false;
    }
    // Check if current date is today
    return this.isCurrentDayDate(this.currentDate);
  }

  /**
   * Calculate left position for current time indicator
   */
  get currentTimeLeft() {
    return `${this.calculateCurrentTimePosition()}px`;
  }

  /**
   * Calculate current time position as left offset in pixels
   */
  calculateCurrentTimePosition() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Day view starts at 6 AM (offset 0)
    const startHour = 6;

    // Calculate position based on actual rendered column widths
    const timelineHeader = this.template.querySelector(
      ".gantt-timeline-header"
    );
    const arenaColumn = this.template.querySelector(".gantt-arena-column");

    if (!timelineHeader || !arenaColumn) {
      // Fallback if elements not found
      return 200;
    }

    const arenaWidth = arenaColumn.offsetWidth;
    const timelineWidth = timelineHeader.offsetWidth;

    // Total hours displayed (6 AM to 11 PM = 18 hours)
    const totalHours = 18;
    const pixelsPerHour = timelineWidth / totalHours;

    // Calculate hours and fractional hours from start
    const hoursFromStart = currentHour - startHour;
    const fractionalHour = currentMinute / 60;
    const totalHoursFromStart = hoursFromStart + fractionalHour;

    // Calculate left position
    const leftOffset = arenaWidth + totalHoursFromStart * pixelsPerHour;

    return leftOffset;
  }

  // ===== LIFECYCLE HOOKS =====

  connectedCallback() {
    this.updateGanttData();
    this.startCurrentTimeUpdates();
  }

  disconnectedCallback() {
    this.stopCurrentTimeUpdates();
  }

  renderedCallback() {
    // Apply utilization bar widths
    const bars = this.template.querySelectorAll(".gantt-utilization-fill");
    bars.forEach((bar) => {
      const width = bar.dataset.width;
      if (width) {
        bar.style.width = `${width}%`;
      }
    });

    // Update current time indicator position
    this.updateCurrentTimeIndicatorPosition();
  }

  /**
   * Start interval to update current time indicator position
   */
  startCurrentTimeUpdates() {
    // Update every 15 minutes (900000 milliseconds)
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.currentTimeInterval = setInterval(() => {
      this.updateCurrentTimeIndicatorPosition();
    }, 900000);
  }

  /**
   * Stop current time updates
   */
  stopCurrentTimeUpdates() {
    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
    }
  }

  /**
   * Update current time indicator position dynamically
   */
  updateCurrentTimeIndicatorPosition() {
    if (!this.showCurrentTimeIndicator) {
      return;
    }

    const indicator = this.template.querySelector(
      ".gantt-current-time-indicator"
    );
    if (indicator) {
      const leftPosition = this.calculateCurrentTimePosition();
      indicator.style.left = `${leftPosition}px`;
    }
  }

  // ===== PRIVATE METHODS =====

  setZoomLevel(level) {
    if (level && level !== this._zoomLevel) {
      this._zoomLevel = level;
      this.updateGanttData();
    }
  }

  setCurrentDate(date) {
    if (date) {
      this._currentDate = date;
      this.updateGanttData();
    }
  }

  // ===== ZOOM HANDLERS =====

  handleDayZoom() {
    this.setZoomLevel("day");
  }

  handleWeekZoom() {
    this.setZoomLevel("week");
  }

  // ===== NAVIGATION HANDLERS =====

  handlePrevious() {
    const newDate = new Date(this.currentDate);
    if (this.isDayZoom) {
      newDate.setDate(newDate.getDate() - 1);
    } else if (this.isWeekZoom) {
      newDate.setDate(newDate.getDate() - 7);
    }
    this.setCurrentDate(newDate);
  }

  handleToday() {
    this.setCurrentDate(new Date());
  }

  handleNext() {
    const newDate = new Date(this.currentDate);
    if (this.isDayZoom) {
      newDate.setDate(newDate.getDate() + 1);
    } else if (this.isWeekZoom) {
      newDate.setDate(newDate.getDate() + 7);
    }
    this.setCurrentDate(newDate);
  }

  // ===== DATA METHODS =====

  /**
   * Generate static mock data for high utilization demonstration
   * Uses deterministic patterns instead of random values
   */
  generateStaticMockData() {
    const mockEvents = [];
    const arenas = [
      "Downtown Arena",
      "North Ice Complex",
      "South Rink",
      "East Hockey Center",
      "West Sports Complex"
    ];

    const teams = [
      "Atoms U10 Red",
      "Atoms U10 Blue",
      "Peewees A",
      "Peewees B",
      "Midgets AA",
      "Midgets A",
      "Bantams U14",
      "Juniors U18"
    ];

    const baseDate = new Date(this.currentDate);
    baseDate.setHours(0, 0, 0, 0);

    let eventId = 1;

    // For week view, generate multiple events per day to demonstrate overflow
    if (this.isWeekZoom) {
      // Generate 7 days of data (centered on current date)
      for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
        const currentDay = new Date(baseDate);
        currentDay.setDate(currentDay.getDate() + dayOffset);

        for (let arenaIndex = 0; arenaIndex < arenas.length; arenaIndex++) {
          const arena = arenas[arenaIndex];
          // Create 12-18 events per day per arena to show overflow (+N label)
          const eventsPerDay = 12 + (arenaIndex % 7);

          for (let eventIdx = 0; eventIdx < eventsPerDay; eventIdx++) {
            // Stagger start times more densely to fit more events
            const startHour = 6 + Math.floor(eventIdx / 2);
            const startMinute = (eventIdx % 2) * 30;
            if (startHour > 22) continue;

            const eventStart = new Date(currentDay);
            eventStart.setHours(startHour, startMinute, 0, 0);

            const eventEnd = new Date(eventStart);
            eventEnd.setMinutes(eventEnd.getMinutes() + 60);

            // Rotate event types
            const eventType =
              eventIdx % 3 === 0
                ? "Game"
                : eventIdx % 3 === 1
                  ? "Practice"
                  : "Tryout";

            const teamIndex =
              (eventIdx + arenaIndex + dayOffset) % teams.length;
            const team1 = teams[teamIndex];
            const team2 =
              eventType === "Game"
                ? teams[(teamIndex + 1) % teams.length]
                : null;

            mockEvents.push({
              id: `mock-${eventId++}`,
              title:
                eventType === "Game"
                  ? `${team1} vs ${team2}`
                  : `${team1} ${eventType}`,
              startTime: eventStart.toISOString(),
              endTime: eventEnd.toISOString(),
              type: eventType,
              location: arena,
              status: "Scheduled"
            });
          }
        }
      }
    } else {
      // Day view: Static patterns for each arena (high utilization)
      const arenaPatterns = [
        // Downtown Arena - 90% utilization (high)
        [6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        // North Ice Complex - 85% utilization (high)
        [6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22],
        // South Rink - 70% utilization (medium-high)
        [7, 8, 9, 10, 12, 14, 15, 17, 18, 19, 20, 21],
        // East Hockey Center - 65% utilization (medium)
        [7, 8, 10, 12, 14, 16, 17, 18, 19, 20, 21],
        // West Sports Complex - 50% utilization (medium)
        [8, 9, 10, 14, 16, 18, 19, 20, 21]
      ];

      for (let arenaIndex = 0; arenaIndex < arenas.length; arenaIndex++) {
        const arena = arenas[arenaIndex];
        const bookedHours = arenaPatterns[arenaIndex];

        for (const hour of bookedHours) {
          // Only 1 event per hour per arena in day view
          const startHour = hour;
          const startMinute = 0;
          const duration = 60; // 1 hour duration

          const eventStart = new Date(baseDate);
          eventStart.setHours(startHour, startMinute, 0, 0);

          const eventEnd = new Date(eventStart);
          eventEnd.setMinutes(eventEnd.getMinutes() + duration);

          // Determine event type based on time of day (static pattern)
          let eventType;
          if (hour >= 18) {
            eventType = "Game";
          } else if (hour < 10) {
            eventType = "Practice";
          } else {
            eventType = hour % 3 === 0 ? "Tryout" : "Practice";
          }

          // Use deterministic team selection based on hour
          const teamIndex = (hour + arenaIndex) % teams.length;
          const team1 = teams[teamIndex];
          const team2 =
            eventType === "Game" ? teams[(teamIndex + 1) % teams.length] : null;

          mockEvents.push({
            id: `mock-${eventId++}`,
            title:
              eventType === "Game"
                ? `${team1} vs ${team2}`
                : `${team1} ${eventType}`,
            startTime: eventStart.toISOString(),
            endTime: eventEnd.toISOString(),
            type: eventType,
            location: arena,
            status: "Scheduled"
          });
        }
      }
    }

    return mockEvents;
  }

  updateGanttData() {
    // Use static mock data for demonstration
    const mockEvents = this.generateStaticMockData();
    this._events = mockEvents;

    // Get unique arenas from events
    const arenasSet = new Set();
    this._events.forEach((event) => {
      if (event.location) {
        arenasSet.add(event.location);
      }
    });

    const arenas = Array.from(arenasSet).sort();

    // Generate timeline based on zoom level
    const zoomConfig =
      GanttArenaView.ZOOM_LEVELS[this.zoomLevel] ||
      GanttArenaView.ZOOM_LEVELS.month;
    this.generateTimeline(zoomConfig);

    // Calculate current day index for header highlighting
    this.calculateCurrentDayIndex();

    // Build arena rows with blocks
    this.arenaRows = arenas.map((arena, index) => {
      const eventsForArena = this._events.filter((e) => e.location === arena);
      const blocks = this.generateBlocksForArena(arena, eventsForArena);
      const utilization = this.calculateUtilization(blocks);

      return {
        id: `arena-${index}`,
        name: arena,
        index,
        utilization,
        blocks
      };
    });
  }

  generateTimeline(zoomConfig) {
    const blocks = [];
    const labels = [];

    if (zoomConfig.blockType === "hour") {
      // Day view: show hourly blocks from 6 AM to 11 PM
      const currentDate = new Date(this.currentDate);
      currentDate.setHours(6, 0, 0, 0); // Start at 6 AM

      for (let i = 0; i < zoomConfig.hours; i++) {
        const blockTime = new Date(currentDate);
        blockTime.setHours(6 + i);

        const hour = blockTime.getHours();
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const label = `${displayHour} ${period}`;

        blocks.push({
          date: blockTime,
          label: label,
          hour: hour,
          headerClass: "gantt-timeline-label"
        });
      }
    } else {
      // Week view: show daily blocks
      const startDate = new Date(this.currentDate);
      startDate.setDate(startDate.getDate() - Math.floor(zoomConfig.days / 2));

      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
      });

      for (let i = 0; i < zoomConfig.days; i++) {
        const blockDate = new Date(startDate);
        blockDate.setDate(blockDate.getDate() + i);

        const isCurrentDay = this.isCurrentDayDate(blockDate);
        const headerClass = isCurrentDay
          ? "gantt-timeline-label gantt-timeline-label--current-day"
          : "gantt-timeline-label";

        blocks.push({
          date: blockDate,
          label: formatter.format(blockDate),
          headerClass
        });
      }
    }

    this.timelineBlocks = blocks;
    this.timelineLabels = labels;
  }

  isCurrentDayDate(date) {
    const testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return testDate.getTime() === today.getTime();
  }

  isPastDate(date) {
    const testDate = new Date(date);
    testDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return testDate.getTime() < today.getTime();
  }

  generateBlocksForArena(arena, events) {
    return this.timelineBlocks.map((timeBlock) => {
      let eventsInBlock;

      if (this.isDayZoom) {
        // Day view: filter events by start hour only (1 event per hour)
        eventsInBlock = events.filter((event) => {
          const eventStart = new Date(event.startTime);
          const blockHour = timeBlock.hour;

          // Only show event in the hour it starts
          return (
            eventStart.getHours() === blockHour &&
            eventStart.getDate() === timeBlock.date.getDate() &&
            eventStart.getMonth() === timeBlock.date.getMonth() &&
            eventStart.getFullYear() === timeBlock.date.getFullYear()
          );
        });
      } else {
        // Week view: filter events by date
        eventsInBlock = events.filter((event) => {
          const eventDate = new Date(event.startTime);
          return (
            eventDate.getFullYear() === timeBlock.date.getFullYear() &&
            eventDate.getMonth() === timeBlock.date.getMonth() &&
            eventDate.getDate() === timeBlock.date.getDate()
          );
        });
      }

      const eventTypes = eventsInBlock.map((e) => {
        switch (e.type) {
          case "Game":
            return "G";
          case "Practice":
            return "P";
          case "Tryout":
            return "T";
          default:
            return "E";
        }
      });

      const isBooked = eventsInBlock.length > 0;
      const eventCount = eventsInBlock.length;
      let blockClass = "gantt-block";

      // Check if this is the current day column or past day
      const isCurrentDay = this.isCurrentDayDate(timeBlock.date);
      const isPastDay = this.isPastDate(timeBlock.date);

      // Determine if we should show multiple event mini-blocks (week view only)
      const hasMultipleEvents = eventCount > 1 && this.isWeekZoom;

      // Add week view class to differentiate styling
      if (this.isWeekZoom) {
        blockClass += " gantt-block--week-view";
      }

      if (!isBooked) {
        blockClass += " gantt-block--empty";
      } else {
        // Determine block color based on primary event type
        const types = eventTypes.join("");
        if (types.includes("G")) {
          blockClass += " gantt-block--game";
        } else if (types.includes("P")) {
          blockClass += " gantt-block--practice";
        } else if (types.includes("T")) {
          blockClass += " gantt-block--tryout";
        } else {
          blockClass += " gantt-block--event";
        }
      }

      // Add current day styling to all blocks in today's column
      if (isCurrentDay) {
        blockClass += " gantt-block--current-day";
      }
      // Add past day styling to all blocks before today
      else if (isPastDay) {
        blockClass += " gantt-block--past-day";
      }

      // Create event visuals for mini-blocks (week view with multiple events)
      // Calculate max visible blocks based on available space:
      // - Cell min-width: 60px
      // - Each mini-block: 12px width + 2px gap = 14px
      // - Show overflow badge only when more than 8 events
      // - Display first 8 events as mini-blocks
      const maxVisibleBlocks = 8;
      const eventVisuals = hasMultipleEvents
        ? eventsInBlock.slice(0, maxVisibleBlocks).map((event, idx) => ({
            id: `${event.id}-${idx}`,
            type: event.type,
            miniBlockClass: `gantt-mini-block gantt-mini-block--${event.type.toLowerCase()}`
          }))
        : [];

      const overflowCount =
        eventCount > maxVisibleBlocks ? eventCount - maxVisibleBlocks : 0;

      // Create display text for single event display (day view or week single event)
      const displayText = eventTypes.join("");

      return {
        date: timeBlock.date,
        isBooked,
        eventTypes: displayText,
        eventCount,
        events: eventsInBlock,
        label: timeBlock.label,
        cssClass: blockClass,
        hasMultipleEvents,
        eventVisuals,
        overflowCount
      };
    });
  }

  calculateUtilization(blocks) {
    const bookedCount = blocks.filter((b) => b.isBooked).length;
    const percentage = Math.round((bookedCount / blocks.length) * 100);

    // Determine utilization level: High (80%+), Medium (50-79%), Low (<50%)
    let level = "low";
    if (percentage >= 80) {
      level = "high";
    } else if (percentage >= 50) {
      level = "medium";
    }

    // Compute the bar class based on level
    const barClass =
      level === "high"
        ? "gantt-utilization-fill gantt-utilization-fill--high"
        : level === "medium"
          ? "gantt-utilization-fill gantt-utilization-fill--medium"
          : "gantt-utilization-fill gantt-utilization-fill--low";

    return {
      percentage,
      bookedCount,
      totalCount: blocks.length,
      level,
      barClass
    };
  }

  calculateCurrentDayIndex() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const index = this.timelineBlocks.findIndex((block) => {
      const blockDate = new Date(block.date);
      blockDate.setHours(0, 0, 0, 0);
      return blockDate.getTime() === today.getTime();
    });

    this.currentDayIndex = index;
  }

  // ===== EVENT HANDLERS =====

  handleBlockClick(event) {
    const blockIndex = parseInt(event.currentTarget.dataset.blockIndex, 10);
    const arenaIndex = parseInt(event.currentTarget.dataset.arenaIndex, 10);

    const arena = this.arenaRows[arenaIndex];
    const block = arena.blocks[blockIndex];

    if (block.events.length > 0) {
      // Fire event for each event in the block
      block.events.forEach((eventData) => {
        this.dispatchEvent(
          new CustomEvent("eventclick", {
            detail: eventData
          })
        );
      });
    }
  }

  handleBlockHover(event) {
    const blockIndex = parseInt(event.currentTarget.dataset.blockIndex, 10);
    const arenaIndex = parseInt(event.currentTarget.dataset.arenaIndex, 10);

    const arena = this.arenaRows[arenaIndex];
    const block = arena.blocks[blockIndex];

    if (block.events.length > 0) {
      const tooltipText = block.events
        .map(
          (e) =>
            `${e.title} (${new Date(e.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit"
            })})`
        )
        .join("\n");

      event.currentTarget.title = tooltipText;
    }
  }
}
