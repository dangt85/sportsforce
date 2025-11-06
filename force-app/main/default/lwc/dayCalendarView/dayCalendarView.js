import { LightningElement, api } from "lwc";

/**
 * dayCalendarView
 *
 * Single-day detailed view with arena breakdown
 * Shows all events for a selected day organized by arena
 *
 * Features:
 * - Single day display with configurable time granularity (15/30/60 min slots)
 * - Arena columns showing only arenas with events that day
 * - Event rendering with visual duration blocks
 * - Drag-and-drop event rescheduling within day or between arenas
 * - Quick-create event form on time slot click
 * - Current time indicator line (if viewing today)
 * - Event filtering and selection
 *
 * Input Props:
 * @api selectedDate - Date object for the day to display
 * @api events - Array of calendar event objects (pre-filtered from parent)
 * @api selectedFilters - Filter state {teams, eventTypes, arenas, divisions}
 * @api timeGranularity - Time slot interval in minutes (15, 30, or 60)
 *
 * Output Events:
 * @fires eventclick - When an event block is clicked
 * @fires eventdrop - When an event is dragged and dropped to new time
 * @fires timeslotclick - When a time slot cell is clicked
 */

export default class DayCalendarView extends LightningElement {
  // ===== API PROPERTIES =====

  @api selectedDate = new Date();

  @api
  get events() {
    return this._events;
  }

  set events(value) {
    this._events = value || [];
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
    }
  }

  @api timeGranularity = 15;

  // ===== CONSTANTS =====

  static TIME_GRANULARITIES = [15, 30, 60];

  // ===== INTERNAL STATE =====

  quickCreateSlot = null; // {arenaIndex, slotIndex}
  currentTimeUpdateInterval = null;
  draggingEventId = null;

  // ===== COMPUTED PROPERTIES =====

  get dayDisplay() {
    const options = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    };
    return this.selectedDate.toLocaleDateString("en-US", options);
  }

  get timeSlots() {
    const slots = [];
    const granularity = this.timeGranularity || 15;
    for (let minutes = 0; minutes < 24 * 60; minutes += granularity) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      slots.push(timeStr);
    }
    return slots;
  }

  get arenaColumns() {
    // Get unique arenas from events on this day
    const arenasWithEvents = new Set();

    this.events.forEach((event) => {
      const eventDate = new Date(event.startTime);
      if (
        eventDate.getFullYear() === this.selectedDate.getFullYear() &&
        eventDate.getMonth() === this.selectedDate.getMonth() &&
        eventDate.getDate() === this.selectedDate.getDate()
      ) {
        if (event.location) {
          arenasWithEvents.add(event.location);
        }
      }
    });

    // Create arena columns with events
    return Array.from(arenasWithEvents)
      .sort()
      .map((arena, index) => ({
        key: `${arena}-${index}`,
        name: arena,
        index,
        events: this._getEventsForArena(arena)
      }));
  }

  get isToday() {
    const today = new Date();
    return (
      this.selectedDate.getFullYear() === today.getFullYear() &&
      this.selectedDate.getMonth() === today.getMonth() &&
      this.selectedDate.getDate() === today.getDate()
    );
  }

  // ===== LIFECYCLE HOOKS =====

  connectedCallback() {
    if (this.isToday) {
      this.startCurrentTimeUpdates();
    }
  }

  disconnectedCallback() {
    if (this.currentTimeUpdateInterval) {
      clearInterval(this.currentTimeUpdateInterval);
    }
  }

  renderedCallback() {
    // Apply positioning styles to event blocks
    const eventBlocks = this.template.querySelectorAll(".event-block");
    eventBlocks.forEach((block) => {
      const top = block.dataset.top;
      const height = block.dataset.height;
      if (top) block.style.top = top;
      if (height) block.style.height = height;
    });
  }

  // ===== EVENT METHODS =====

  /**
   * Handle time slot click - show quick-create form
   */
  handleTimeSlotClick(event) {
    const slotIndex = parseInt(event.currentTarget.dataset.slotIndex, 10);
    const arenaIndex = parseInt(event.currentTarget.dataset.arenaIndex, 10);

    this.quickCreateSlot = { arenaIndex, slotIndex };

    // Fire event for parent component
    this.dispatchEvent(
      new CustomEvent("timeslotclick", {
        detail: {
          arenaIndex,
          slotIndex,
          time: this.timeSlots[slotIndex],
          date: this.selectedDate
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
   * Handle drag start
   */
  handleEventDragStart(event) {
    const eventId = event.currentTarget.dataset.eventId;
    this.draggingEventId = eventId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", eventId);
  }

  /**
   * Handle drag over time slot
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    event.currentTarget.classList.add("drag-over");
  }

  /**
   * Handle drag leave
   */
  handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
  }

  /**
   * Handle event drop
   */
  handleEventDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    const eventId = event.dataTransfer.getData("text/plain");
    const slotIndex = parseInt(event.currentTarget.dataset.slotIndex, 10);
    const arenaIndex = parseInt(event.currentTarget.dataset.arenaIndex, 10);
    const slot = this.timeSlots[slotIndex];

    // Fire event for parent component
    this.dispatchEvent(
      new CustomEvent("eventdrop", {
        detail: {
          eventId,
          arenaIndex,
          slotIndex,
          time: slot,
          date: this.selectedDate
        }
      })
    );
  }

  /**
   * Handle quick-create form submit
   */
  handleQuickCreateSubmit() {
    const form = this.template.querySelector(".quick-create-form");
    if (!form) return;

    const titleInput = form.querySelector(
      "lightning-input[data-field='title']"
    );
    const typeSelect = form.querySelector(
      "lightning-combobox[data-field='type']"
    );
    const startInput = form.querySelector(
      "lightning-input[data-field='start']"
    );
    const endInput = form.querySelector("lightning-input[data-field='end']");

    const title = titleInput?.value;
    const type = typeSelect?.value;
    const startTime = startInput?.value;
    const endTime = endInput?.value;

    if (!title || !type || !startTime || !endTime) {
      return;
    }

    const { arenaIndex } = this.quickCreateSlot;

    this.dispatchEvent(
      new CustomEvent("quickcreate", {
        detail: {
          title,
          type,
          startTime,
          endTime,
          date: this.selectedDate,
          arena: this.arenaColumns[arenaIndex]?.name
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

  // ===== HELPER METHODS =====

  /**
   * Get events for a specific arena on this day
   */
  _getEventsForArena(arena) {
    return this.events
      .filter(
        (event) =>
          event.location === arena &&
          this._isEventOnDate(event, this.selectedDate)
      )
      .map((event) => this._processEvent(event));
  }

  /**
   * Check if event is on the selected date
   */
  _isEventOnDate(event, date) {
    const eventDate = new Date(event.startTime);
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    );
  }

  /**
   * Process event for rendering
   */
  _processEvent(event) {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    // Calculate position in grid
    const granularity = this.timeGranularity || 15;
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    const startSlot = Math.floor(startMinutes / granularity);
    const duration = endMinutes - startMinutes;
    const durationSlots = Math.ceil(duration / granularity);

    // Determine styling
    const cssClass = this._getEventCssClass(event.type, event.status);

    // Check for conflicts with other events
    const hasConflict = this._checkEventConflict(event);

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      status: event.status,
      location: event.location,
      startTime: startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      endTime: endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      cssClass,
      hasConflict,
      top: `${(startSlot * 60) / ((24 * 60) / ((24 * 60) / granularity))}px`,
      height: `${(durationSlots * 60) / ((24 * 60) / ((24 * 60) / granularity))}px`,
      startSlot,
      durationSlots
    };
  }

  /**
   * Get CSS classes for event styling
   */
  _getEventCssClass(type, status) {
    let classes = "event-block";

    // Type-based styling
    switch (type) {
      case "Game":
        classes += " event-game";
        break;
      case "Practice":
        classes += " event-practice";
        break;
      case "Tryout":
        classes += " event-tryout";
        break;
      case "Tournament":
        classes += " event-tournament";
        break;
      default:
        break;
    }

    // Status-based styling
    if (status === "Cancelled") {
      classes += " event-cancelled";
    }

    return classes;
  }

  /**
   * Check if event has time conflicts with other events in same arena
   */
  _checkEventConflict(event) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    return this.events.some((other) => {
      if (other.id === event.id || other.location !== event.location) {
        return false;
      }

      const otherStart = new Date(other.startTime);
      const otherEnd = new Date(other.endTime);

      // Check if times overlap
      return eventStart < otherEnd && eventEnd > otherStart;
    });
  }

  /**
   * Start current time indicator updates (for today's view only)
   */
  startCurrentTimeUpdates() {
    // Update immediately
    this.updateCurrentTimeIndicator();

    // Update every minute
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.currentTimeUpdateInterval = setInterval(() => {
      this.updateCurrentTimeIndicator();
    }, 60000);
  }

  /**
   * Update current time indicator position
   */
  updateCurrentTimeIndicator() {
    if (!this.isToday) return;

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const granularity = this.timeGranularity || 15;
    const slotHeight = 60 / (60 / granularity); // pixels per minute
    const topPosition = minutes * slotHeight;

    const indicators = this.template.querySelectorAll(
      ".current-time-indicator"
    );
    indicators.forEach((indicator) => {
      indicator.style.top = `${topPosition}px`;
    });

    // Update time label
    const timeLabel = this.template.querySelector(".current-time-label");
    if (timeLabel) {
      timeLabel.textContent = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }

  get eventTypeOptions() {
    return [
      { label: "Game", value: "Game" },
      { label: "Practice", value: "Practice" },
      { label: "Tryout", value: "Tryout" },
      { label: "Tournament", value: "Tournament" }
    ];
  }
}
