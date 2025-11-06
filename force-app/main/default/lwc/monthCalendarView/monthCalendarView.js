import { LightningElement, api } from "lwc";

/**
 * monthCalendarView
 *
 * Displays a monthly calendar view with events
 * Shows 6 weeks (42 days) in a grid layout
 * Days from previous/next months shown in muted style
 * Events displayed within their respective day cells
 *
 * Inputs:
 * @api currentDate - Date to display (defaults to today)
 * @api events - Array of event objects
 * @api selectedFilters - Filter state object {teams, eventTypes, arenas, divisions}
 * @api selectedDate - Currently selected date (for visual highlighting)
 *
 * Outputs:
 * dayselected - Fires when a day is selected
 * eventselected - Fires when an event is selected
 */

export default class MonthCalendarView extends LightningElement {
  @api currentDate = new Date();
  @api events = [];
  @api selectedDate = null;

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

  // ===== CONSTANTS =====

  static DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ===== COMPUTED PROPERTIES =====

  get daysOfWeek() {
    return MonthCalendarView.DAYS_OF_WEEK;
  }

  get monthYearDisplay() {
    const date = this.currentDate || new Date();
    const options = { month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  get calendarWeeks() {
    const date = this.currentDate || new Date();
    return this._generateCalendarWeeks(date);
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle day cell click - only for current month days
   */
  handleDayClick(event) {
    const dateStr = event.currentTarget.dataset.date;
    const cellClasses = event.currentTarget.className;

    // Don't allow selecting other month dates
    if (cellClasses.includes("other-month")) {
      return;
    }

    const [year, month, day] = dateStr.split("-");
    const selectedDate = new Date(year, month - 1, day);

    this.dispatchEvent(
      new CustomEvent("dayselected", {
        detail: selectedDate,
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Handle event click
   */
  handleEventClick(event) {
    event.stopPropagation();

    const eventId = event.currentTarget.dataset.eventId;
    const eventData = this.events.find((e) => e.id === eventId);

    if (eventData) {
      this.dispatchEvent(
        new CustomEvent("eventselected", {
          detail: eventData,
          bubbles: true,
          composed: true
        })
      );
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Generate calendar weeks structure for the month
   * @private
   * @returns {Array} Array of week objects with day details
   */
  _generateCalendarWeeks(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Calculate starting position (0 = Sunday, 6 = Saturday)
    const startingDayOfWeek = firstDay.getDay();

    // Calculate days needed from previous month
    const previousMonthDays = startingDayOfWeek;

    // Total days in this month
    const daysInMonth = lastDay.getDate();

    // 6 weeks * 7 days = 42 cells for the calendar grid
    const weeks = [];
    let cellIndex = 0;

    // Generate 6 weeks
    for (let week = 0; week < 6; week++) {
      const days = [];
      let weekId = `week-${year}-${month}-${week}`;

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        let dayDate;
        let dayOfMonth;
        let isCurrentMonth = false;
        let isToday = false;

        if (cellIndex < previousMonthDays) {
          // Previous month's days
          const prevMonth = month === 0 ? 11 : month - 1;
          const prevYear = month === 0 ? year - 1 : year;
          const prevLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
          dayOfMonth = prevLastDay - previousMonthDays + cellIndex + 1;
          dayDate = new Date(prevYear, prevMonth, dayOfMonth);
        } else if (cellIndex < previousMonthDays + daysInMonth) {
          // Current month's days
          dayOfMonth = cellIndex - previousMonthDays + 1;
          dayDate = new Date(year, month, dayOfMonth);
          isCurrentMonth = true;

          // Check if today
          const today = new Date();
          if (dayDate.toDateString() === today.toDateString()) {
            isToday = true;
          }
        } else {
          // Next month's days
          dayOfMonth = cellIndex - previousMonthDays - daysInMonth + 1;
          const nextMonth = month === 11 ? 0 : month + 1;
          const nextYear = month === 11 ? year + 1 : year;
          dayDate = new Date(
            nextMonth === 0 ? nextYear : nextYear,
            nextMonth === 0 ? 0 : nextMonth,
            dayOfMonth
          );
        }

        const dateStr = this._formatDateStr(dayDate);
        const isSelected =
          this.selectedDate &&
          this._formatDateStr(this.selectedDate) === dateStr;

        // Get events for this day
        const dayEvents = isCurrentMonth ? this._getEventsForDay(dayDate) : [];

        const cellClass = this._getCellClass(
          isCurrentMonth,
          isToday,
          isSelected
        );

        days.push({
          dateStr,
          dayOfMonth,
          cellClass,
          events: dayEvents,
          isCurrentMonth
        });

        cellIndex++;
      }

      weeks.push({
        id: weekId,
        days
      });
    }

    return weeks;
  }

  /**
   * Get events for a specific day
   * @private
   * @param {Date} date - The date to get events for
   * @returns {Array} Array of event objects for the day
   */
  _getEventsForDay(date) {
    // Use toDateString() for robust date comparison
    const dateCompare = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).toDateString();

    // Filter events for this day
    let dayEvents = this.events.filter((event) => {
      const eventCompare = new Date(
        event.startDateTime.getFullYear(),
        event.startDateTime.getMonth(),
        event.startDateTime.getDate()
      ).toDateString();
      return eventCompare === dateCompare;
    });

    // Apply selected filters
    dayEvents = dayEvents.filter((event) => {
      return this._matchesFilters(event);
    });

    // Transform events for display
    return dayEvents.map((event) => ({
      id: event.id,
      title: event.title,
      displayTime: this._formatTime(event.startDateTime),
      eventClass: this._getEventClass(event),
      startDateTime: event.startDateTime,
      durationMinutes: event.durationMinutes,
      team: event.team,
      type: event.type
    }));
  }

  /**
   * Check if event matches current filters
   * @private
   * @param {Object} event - Event object
   * @returns {boolean} True if event matches filters
   */
  _matchesFilters(event) {
    const { teams, eventTypes, arenas, divisions } = this._selectedFilters;

    // If no filters selected, show all events
    if (
      teams.length === 0 &&
      eventTypes.length === 0 &&
      arenas.length === 0 &&
      divisions.length === 0
    ) {
      return true;
    }

    // Check team filter
    if (teams.length > 0 && !teams.includes(event.team)) {
      return false;
    }

    // Check event type filter
    if (eventTypes.length > 0 && !eventTypes.includes(event.type)) {
      return false;
    }

    // Check arena filter
    if (arenas.length > 0 && event.arena && !arenas.includes(event.arena)) {
      return false;
    }

    // Check division filter
    if (
      divisions.length > 0 &&
      event.division &&
      !divisions.includes(event.division)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get CSS classes for day cell
   * @private
   * @returns {string} CSS class string
   */
  _getCellClass(isCurrentMonth, isToday, isSelected) {
    const classes = ["day-cell", "slds-border--top"];

    if (!isCurrentMonth) {
      classes.push("other-month");
    }

    if (isToday) {
      classes.push("today");
    }

    if (isSelected) {
      classes.push("active");
    }

    return classes.join(" ");
  }

  /**
   * Get CSS classes for event item
   * @private
   * @param {Object} event - Event object
   * @returns {string} CSS class string
   */
  _getEventClass(event) {
    const baseClass = "event-item slds-text-body--small";
    const typeClass = `event-${event.type.toLowerCase()}`;
    return `${baseClass} ${typeClass}`;
  }

  /**
   * Format date to YYYY-MM-DD string
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  _formatDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Format time for display (e.g., "2:30 PM")
   * @private
   * @param {Date} dateTime - DateTime to format
   * @returns {string} Formatted time string
   */
  _formatTime(dateTime) {
    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    };
    return dateTime.toLocaleTimeString("en-US", options);
  }
}
