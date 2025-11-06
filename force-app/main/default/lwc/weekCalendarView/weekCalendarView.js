import { LightningElement, api } from "lwc";

/**
 * weekCalendarView
 *
 * Primary calendar interface with time grid display (Mon-Sun)
 * Supports drag-drop event rescheduling, quick event creation, and time slot interactions
 *
 * Features:
 * - Week view with configurable time granularity (15/30/60 min slots)
 * - Optional weekend hiding (Mon-Fri only)
 * - Event rendering with visual duration blocks
 * - Drag-and-drop event rescheduling
 * - Quick-create event form on time slot click
 * - Current time indicator line
 * - Event filtering and selection
 *
 * Input Props:
 * @api currentDateStr - ISO date string (YYYY-MM-DD) to display in calendar (defaults to today)
 * @api currentDate - Date object property for internal/programmatic use (alternative to currentDateStr)
 * @api events - Array of calendar event objects (pre-filtered from parent)
 * @api selectedDate - Currently selected date (for highlighting)
 * @api timeGranularity - Time slot interval in minutes (15, 30, or 60)
 * @api showWeekends - Include Saturday/Sunday in view (default: true)
 * @api selectedFilters - Filter state {teams, eventTypes, arenas, divisions}
 *
 * Output Events:
 * @fires eventclick - When an event block is clicked
 * @fires eventdrop - When an event is dragged and dropped to new time
 * @fires timeslotclick - When a time slot cell is clicked
 * @fires quickcreate - When quick-create form is submitted
 */

export default class WeekCalendarView extends LightningElement {
  // ===== API PROPERTIES =====

  // Internal date property
  _currentDate = new Date();

  @api
  get currentDate() {
    return this._currentDate;
  }

  set currentDate(value) {
    if (value instanceof Date) {
      this._currentDate = new Date(value);
    } else if (typeof value === "string" && value) {
      this._currentDate = new Date(value);
    } else {
      this._currentDate = new Date();
    }
    // Reload events when date changes
    if (this.eventsLoaded) {
      this.loadEvents();
    }
  }

  // String property for metadata (external API)
  @api
  get currentDateStr() {
    const year = this._currentDate.getFullYear();
    const month = String(this._currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(this._currentDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  set currentDateStr(value) {
    if (value && typeof value === "string") {
      this._currentDate = new Date(value);
    } else {
      this._currentDate = new Date();
    }
  }

  @api events = [];
  @api selectedDate = null;
  @api timeGranularity = 15; // 15, 30, or 60 minutes

  _showWeekends = false;

  @api
  get showWeekends() {
    return this._showWeekends;
  }

  set showWeekends(value) {
    this._showWeekends = value !== false;
  }

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
      // Reload events when filters change
      if (this.eventsLoaded) {
        this.loadEvents();
      }
    }
  }

  // ===== INTERNAL STATE =====

  draggedEvent = null;
  dragOffset = { x: 0, y: 0 };
  quickCreateSlot = null; // {dayIndex, slotIndex}
  currentTimeUpdateInterval = null;

  // ===== DATA FETCHING STATE =====

  isLoading = false;
  error = null;
  eventsLoaded = false;

  // ===== CONSTANTS =====

  static DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  static FULL_DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  static WORK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  static MIN_TIME = 0; // Midnight
  static MAX_TIME = 24 * 60; // End of day (minutes)

  // ===== LIFECYCLE HOOKS =====

  connectedCallback() {
    // Start current time indicator updates
    this.startCurrentTimeUpdates();

    // Fetch events from Apex controller if not provided via @api property
    if (!this.events || this.events.length === 0) {
      this.loadEvents();
    }
  }

  disconnectedCallback() {
    // Clean up interval
    if (this.currentTimeUpdateInterval) {
      clearInterval(this.currentTimeUpdateInterval);
    }
  }

  renderedCallback() {
    // Initialize drag handlers and update current time indicator position
    this.initializeDragHandlers();
    this.updateCurrentTimeIndicatorPosition();
  }

  // ===== COMPUTED PROPERTIES =====

  /**
   * Get display string for month and year
   */
  get monthYearDisplay() {
    const date = this.currentDate || new Date();
    const options = { month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  /**
   * Calculate week start (Monday) and end (Sunday) dates
   */
  get weekDays() {
    const weekStart = this.getWeekStartDate(this.currentDate);
    const days = [];

    for (let i = 0; i < (this.showWeekends ? 7 : 5); i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    return days;
  }

  /**
   * Generate array of time slot labels (12-hour format with AM/PM)
   */
  get timeSlots() {
    const slots = [];
    const totalSlots = WeekCalendarView.MAX_TIME / this.timeGranularity;

    for (let i = 0; i < totalSlots; i++) {
      const minutes = i * this.timeGranularity;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      const timeStr = `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
      slots.push(timeStr);
    }

    return slots;
  }

  /**
   * Get day labels with abbreviated day names
   */
  get dayLabels() {
    return this.weekDays.map((date) => {
      const dayName = WeekCalendarView.DAYS_OF_WEEK[date.getDay()];
      const dayNum = date.getDate();
      return `${dayName} ${dayNum}`;
    });
  }

  /**
   * Get week days with computed date keys and events for template rendering
   */
  get weekDaysWithKeys() {
    const eventsByDay = this.eventsByDay;

    return this.weekDays.map((day, index) => {
      const dateKey = this.getDateKey(day);
      return {
        date: day,
        index: index,
        key: dateKey,
        isToday: this.isToday(day),
        events: eventsByDay[dateKey] || []
      };
    });
  }

  /**
   * Get all events positioned for rendering with conflict detection
   */
  get positionedEvents() {
    const positioned = this.events.map((event) => {
      const { dayIndex, position } = this.getEventPosition(event);
      return {
        ...event,
        dayIndex,
        ...position,
        hasConflict: false, // Will be updated by conflict detection
        cssClass: "" // Will be set after conflict detection
      };
    });

    // Detect conflicts
    this.detectConflicts(positioned);

    // Set CSS classes after conflict detection
    positioned.forEach((event) => {
      event.cssClass = this.getEventCssClass(event);
    });

    return positioned;
  }

  /**
   * Detect overlapping events and mark them as conflicting
   * Conflicts occur when events overlap in time on the same day
   *
   * @param {Array} positionedEvents - Array of positioned event objects
   */
  detectConflicts(positionedEvents) {
    // Reset conflict flags
    positionedEvents.forEach((event) => {
      event.hasConflict = false;
    });

    // Check each event against all other events
    for (let i = 0; i < positionedEvents.length; i++) {
      const event1 = positionedEvents[i];
      const start1 = new Date(event1.startTime);
      const end1 = new Date(event1.endTime);

      for (let j = i + 1; j < positionedEvents.length; j++) {
        const event2 = positionedEvents[j];
        const start2 = new Date(event2.startTime);
        const end2 = new Date(event2.endTime);

        // Check if events overlap in time
        // They conflict if: start1 < end2 AND start2 < end1
        if (start1 < end2 && start2 < end1) {
          // Also check if they're on the same day
          if (this.isSameDay(start1, start2)) {
            event1.hasConflict = true;
            event2.hasConflict = true;
          }
        }
      }
    }
  }

  /**
   * Check if two dates are on the same day (ignoring time)
   *
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} True if both dates are on the same calendar day
   */
  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Group events by day column for rendering
   * Uses ISO date strings as keys for template compatibility
   */
  get eventsByDay() {
    const eventsByDay = {};

    // Initialize empty arrays for each day using ISO date string as key
    this.weekDays.forEach((day) => {
      const dateKey = this.getDateKey(day);
      eventsByDay[dateKey] = [];
    });

    // Add events to their respective days
    this.positionedEvents.forEach((event) => {
      const dayIndex = event.dayIndex;
      if (
        dayIndex !== undefined &&
        dayIndex >= 0 &&
        dayIndex < this.weekDays.length
      ) {
        const day = this.weekDays[dayIndex];
        const dateKey = this.getDateKey(day);
        eventsByDay[dateKey].push(event);
      }
    });

    return eventsByDay;
  }

  /**
   * Convert Date to ISO date string key (YYYY-MM-DD) for object access
   */
  getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // ===== DATA FETCHING =====

  /**
   * Load events from Apex controller for the current week
   * Gracefully handles test environment where Apex controller is not available
   */
  async loadEvents() {
    // Skip loading if running in test environment (no Salesforce context)
    if (!globalThis.Aura && typeof process !== "undefined") {
      this.eventsLoaded = true;
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      // Calculate week start and end dates
      const weekStart = this.getWeekStartDate(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

      // Format dates for Apex
      const startDateStr = this._formatDateForApex(weekStart);
      const endDateStr = this._formatDateForApex(weekEnd);

      // Dynamically import Apex controller method
      // Using @salesforce/apex for LWC
      let getEventsByDateRange;
      try {
        const module = await import(
          "@salesforce/apex/ScheduleCalendarController.getEventsByDateRange"
        );
        getEventsByDateRange = module.default;
      } catch (err) {
        // If import fails, we're likely in a test environment
        // eslint-disable-next-line no-console
        console.warn(
          "Apex controller not available. Events must be provided via @api property. Error:",
          err.message
        );
        this.eventsLoaded = true;
        this.isLoading = false;
        return;
      }

      // Call Apex controller with filters
      const response = await getEventsByDateRange({
        startDate: startDateStr,
        endDate: endDateStr,
        teamIds: this.selectedFilters.teams,
        eventTypes: this.selectedFilters.eventTypes,
        arenaIds: this.selectedFilters.arenas,
        divisionIds: this.selectedFilters.divisions
      });

      if (response.success) {
        // Transform Apex response to match component expectations
        const transformedEvents = (response.allEvents || []).map((event) => ({
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          type: event.eventType,
          status: event.status,
          location: event.location
        }));

        // Update events array without reassigning the @api property
        if (Array.isArray(this.events)) {
          this.events.splice(0, this.events.length, ...transformedEvents);
        } else {
          // If events is not yet initialized, create it through the internal state
          // This shouldn't happen in normal usage but provides a fallback
          // eslint-disable-next-line @lwc/lwc/no-api-reassignments
          this.events = transformedEvents;
        }
        this.eventsLoaded = true;
      } else {
        this.error = response.errorMessage || "Failed to load events";
      }
    } catch (error) {
      console.error("Error loading events:", error);
      this.error = "Unable to load calendar events. Please try again.";
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Format date for Apex Date parameter (YYYY-MM-DD)
   */
  _formatDateForApex(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle time slot click to open quick-create form
   */
  handleTimeSlotClick(event) {
    const slotElement = event.currentTarget;
    const dayIndex = parseInt(slotElement.dataset.dayIndex, 10);
    const slotIndex = parseInt(slotElement.dataset.slotIndex, 10);

    this.quickCreateSlot = { dayIndex, slotIndex };

    // Fire time slot click event
    this.dispatchEvent(
      new CustomEvent("timeslotclick", {
        detail: {
          dayIndex,
          slotIndex,
          date: this.weekDays[dayIndex],
          time: this.timeSlots[slotIndex]
        }
      })
    );
  }

  /**
   * Handle event block click to show detail panel
   */
  handleEventClick(event) {
    event.stopPropagation();

    const eventId = event.currentTarget.dataset.eventId;
    const eventData = this.events.find((e) => e.id === eventId);

    if (eventData) {
      this.dispatchEvent(
        new CustomEvent("eventclick", {
          detail: eventData
        })
      );
    }
  }

  /**
   * Handle event drag start
   */
  handleEventDragStart(event) {
    const eventId = event.currentTarget.dataset.eventId;
    const eventData = this.events.find((e) => e.id === eventId);

    if (eventData) {
      this.draggedEvent = eventData;
      this.dragOffset = {
        x: event.clientX,
        y: event.clientY
      };

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("eventId", eventId);

      // Visual feedback
      event.currentTarget.style.opacity = "0.6";
      event.currentTarget.style.zIndex = "100";
    }
  }

  /**
   * Handle drag over time slot
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const slotElement = event.currentTarget;
    slotElement.classList.add("drag-over");
  }

  /**
   * Handle drag leave
   */
  handleDragLeave(event) {
    const slotElement = event.currentTarget;
    slotElement.classList.remove("drag-over");
  }

  /**
   * Handle event drop
   */
  handleEventDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const slotElement = event.currentTarget;
    slotElement.classList.remove("drag-over");

    if (!this.draggedEvent) {
      return;
    }

    const dayIndex = parseInt(slotElement.dataset.dayIndex, 10);
    const slotIndex = parseInt(slotElement.dataset.slotIndex, 10);

    const newDateTime = this.calculateEventDateTime(dayIndex, slotIndex);

    // Calculate new end time based on event duration
    const startTime = new Date(this.draggedEvent.startTime);
    const endTime = new Date(this.draggedEvent.endTime);
    const duration = endTime - startTime;
    const newEndDateTime = new Date(newDateTime.getTime() + duration);

    // Fire event drop
    this.dispatchEvent(
      new CustomEvent("eventdrop", {
        detail: {
          eventId: this.draggedEvent.id,
          newDateTime: newDateTime.toISOString(),
          newEndDateTime: newEndDateTime.toISOString()
        }
      })
    );

    // Reset drag state
    this.draggedEvent = null;
    const eventBlocks = this.shadowRoot.querySelectorAll(".event-block");
    eventBlocks.forEach((block) => {
      block.style.opacity = "1";
      block.style.zIndex = "auto";
    });
  }

  /**
   * Handle quick-create form submission
   */
  handleQuickCreateSubmit(event) {
    event.preventDefault();

    // Get form inputs from shadow DOM
    const inputs = this.shadowRoot.querySelectorAll(
      "lightning-input, lightning-combobox"
    );
    let title = "";
    let eventType = "";
    let startTime = "";
    let endTime = "";

    inputs.forEach((input) => {
      const label = input.getAttribute("label");

      if (label === "Event Title") {
        title = input.value;
      } else if (label === "Event Type") {
        eventType = input.value;
      } else if (label === "Start Time") {
        startTime = input.value;
      } else if (label === "End Time") {
        endTime = input.value;
      }
    });

    // Validate form
    if (!title || !eventType || !startTime || !endTime) {
      console.warn("Quick-create form incomplete");
      return;
    }

    // Build complete datetime objects
    const day = this.weekDays[this.quickCreateSlot.dayIndex];
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startDateTime = new Date(day);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(day);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    this.dispatchEvent(
      new CustomEvent("quickcreate", {
        detail: {
          title,
          eventType,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          dayIndex: this.quickCreateSlot.dayIndex,
          slotIndex: this.quickCreateSlot.slotIndex
        }
      })
    );

    this.quickCreateSlot = null;
  }

  /**
   * Handle quick-create form cancel
   */
  handleQuickCreateCancel() {
    this.quickCreateSlot = null;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Get the Monday of the week containing the given date
   */
  getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);
    return new Date(d);
  }

  /**
   * Calculate day index and position for an event
   */
  getEventPosition(event) {
    const eventStart = new Date(event.startTime);

    // Check if event is in current week
    const eventDay = this.getDateOnly(eventStart);
    const dayIndex = this.weekDays.findIndex(
      (d) => this.getDateOnly(d) === eventDay
    );

    if (dayIndex === -1) {
      return { dayIndex: undefined, position: {} };
    }

    // Calculate position within day
    const eventEnd = new Date(event.endTime);
    const dayStart = new Date(this.weekDays[dayIndex]);
    dayStart.setHours(0, 0, 0, 0);

    const minutesFromDayStart = (eventStart - dayStart) / (1000 * 60);
    const durationMinutes = (eventEnd - eventStart) / (1000 * 60);

    const slotIndex = Math.floor(minutesFromDayStart / this.timeGranularity);
    const topPercent = (minutesFromDayStart / (24 * 60)) * 100;
    const heightPercent = (durationMinutes / (24 * 60)) * 100;

    return {
      dayIndex,
      position: {
        slotIndex,
        top: `${topPercent}%`,
        height: `${Math.max(heightPercent, 2)}%`, // Minimum visible height
        title: event.title
      }
    };
  }

  /**
   * Get CSS class for event block based on type and state
   */
  getEventCssClass(event) {
    const classes = ["event-block"];

    if (event.type) {
      classes.push(`event-${event.type.toLowerCase()}`);
    }

    if (event.hasConflict) {
      classes.push("conflict");
    }

    if (this.draggedEvent?.id === event.id) {
      classes.push("dragging");
    }

    return classes.join(" ");
  }

  /**
   * Calculate the exact datetime for a given day and time slot index
   */
  calculateEventDateTime(dayIndex, slotIndex) {
    const date = this.weekDays[dayIndex];
    const minutes = slotIndex * this.timeGranularity;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const dateTime = new Date(date);
    dateTime.setHours(hours, mins, 0, 0);

    return dateTime;
  }

  /**
   * Get date portion only (ignore time)
   */
  getDateOnly(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  /**
   * Initialize drag-drop event handlers
   */
  initializeDragHandlers() {
    if (!this.shadowRoot) {
      return;
    }

    const eventBlocks = this.shadowRoot.querySelectorAll(".event-block");
    eventBlocks.forEach((block) => {
      if (!block.hasAttribute("draggable")) {
        block.setAttribute("draggable", "true");
      }
    });
  }

  /**
   * Start interval for updating current time indicator
   * Only updates once per minute for performance
   */
  startCurrentTimeUpdates() {
    // Update immediately on render
    this.updateCurrentTimeIndicatorPosition();

    // Then schedule updates - this is acceptable as it's UI-only and non-critical
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.currentTimeUpdateInterval = setInterval(() => {
      this.updateCurrentTimeIndicatorPosition();
    }, 60000); // Update every minute
  }

  /**
   * Update current time indicator position
   */
  updateCurrentTimeIndicatorPosition() {
    const indicator = this.shadowRoot?.querySelector(".current-time-indicator");
    if (!indicator) {
      return;
    }

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const totalMinutes = 24 * 60;
    const percentage = (minutes / totalMinutes) * 100;

    indicator.style.top = `${percentage}%`;

    // Update time label
    const timeLabel = this.shadowRoot?.querySelector(".current-time-label");
    if (timeLabel) {
      const hours = now.getHours();
      const mins = now.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      timeLabel.textContent = `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
    }
  }

  /**
   * Check if a time slot is available (no conflicts)
   */
  isTimeSlotAvailable(dayIndex, slotIndex, duration) {
    const slotDateTime = this.calculateEventDateTime(dayIndex, slotIndex);
    const slotEndTime = new Date(
      slotDateTime.getTime() + duration * this.timeGranularity * 60000
    );

    return !this.events.some((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check for overlap
      return (
        (slotDateTime >= eventStart && slotDateTime < eventEnd) ||
        (slotEndTime > eventStart && slotEndTime <= eventEnd) ||
        (slotDateTime <= eventStart && slotEndTime >= eventEnd)
      );
    });
  }

  /**
   * Get visible events for a specific day
   */
  getEventsForDay(dayIndex) {
    const day = this.weekDays[dayIndex];
    const dayStart = this.getDateOnly(day);

    return this.events.filter((event) => {
      const eventStart = new Date(event.startTime);
      return this.getDateOnly(eventStart) === dayStart;
    });
  }

  /**
   * Check if today is in the current week
   */
  isTodayInWeek() {
    const today = this.getDateOnly(new Date());
    return this.weekDays.some((d) => this.getDateOnly(d) === today);
  }

  /**
   * Check if a given date is today
   */
  isToday(date) {
    return this.getDateOnly(date) === this.getDateOnly(new Date());
  }

  /**
   * Get inline style for event block positioning
   */
  getEventStyle(event) {
    const { position } = this.getEventPosition(event);

    if (!position.top || !position.height) {
      return "";
    }

    return `top: ${position.top}; height: ${position.height};`;
  }

  /**
   * Check if a given day index is today
   */
  isTodayColumn(dayIndex) {
    return this.isToday(this.weekDays[dayIndex]);
  }

  /**
   * Get event type options for quick-create dropdown
   */
  get eventTypeOptions() {
    return [
      { label: "Game", value: "Game" },
      { label: "Practice", value: "Practice" },
      { label: "Tryout", value: "Tryout" },
      { label: "Tournament", value: "Tournament" },
      { label: "Training", value: "Training" },
      { label: "Other", value: "Other" }
    ];
  }

  /**
   * Get start time for quick-create form (current slot time)
   */
  getQuickCreateStartTime() {
    if (!this.quickCreateSlot) {
      return "";
    }

    const { slotIndex } = this.quickCreateSlot;
    const minutes = slotIndex * this.timeGranularity;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  /**
   * Get end time for quick-create form (one time slot later)
   */
  getQuickCreateEndTime() {
    if (!this.quickCreateSlot) {
      return "";
    }

    const slotIndex = this.quickCreateSlot.slotIndex;
    const minutes = (slotIndex + 1) * this.timeGranularity;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }
}
