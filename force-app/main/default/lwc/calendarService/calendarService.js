/**
 * CalendarService - Headless business logic for calendar functionality
 *
 * Responsibilities:
 * - Fetch and cache events from Salesforce
 * - Generate time slots for calendar grid
 * - Apply filters to events
 * - Detect scheduling conflicts
 * - Handle drag-drop rescheduling logic
 * - Manage user preferences
 * - Event-driven communication with components
 *
 * No UI dependencies - testable service layer
 */

export default class CalendarService {
  constructor(leagueId, seasonId = null) {
    this.leagueId = leagueId;
    this.seasonId = seasonId;
    this.cache = new Map();
    this.subscribers = new Map();
    this.userPreferences = {
      timeGranularity: 15, // 15, 30, or 60 minutes
      showWeekends: true,
      theme: "light",
      defaultView: "week"
    };
  }

  // ===== DATA FETCHING =====

  /**
   * Fetch events for a date range with optional filters
   * Implements caching with TTL (5 minutes)
   *
   * @param {Date} startDate - Start of date range
   * @param {Date} endDate - End of date range
   * @param {Object} filters - Optional filters (teams, eventTypes, arenas, divisions)
   * @returns {Promise<Array>} Array of CalendarEvent objects
   */
  async fetchEvents(startDate, endDate, filters = {}) {
    const cacheKey = this._generateCacheKey(startDate, endDate, filters);

    // Check cache first
    if (this.cache.has(cacheKey) && !this._isCacheExpired(cacheKey)) {
      return this.cache.get(cacheKey).events;
    }

    try {
      // Fetch from Apex controller
      const response = await this._callApex("getEventsByDateRange", {
        startDate: this._formatDate(startDate),
        endDate: this._formatDate(endDate),
        teamIds: filters.teams || [],
        eventTypes: filters.eventTypes || [],
        arenaIds: filters.arenas || [],
        divisionIds: filters.divisions || []
      });

      if (!response.success) {
        throw new Error(response.errorMessage || "Failed to fetch events");
      }

      const events = response.allEvents || [];

      // Cache result
      this.cache.set(cacheKey, {
        events,
        timestamp: Date.now(),
        totalRecords: response.totalRecords
      });

      return events;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }

  // ===== TIME SLOT GENERATION =====

  /**
   * Generate time slots for a date range
   *
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Number} granularityMinutes - Slot granularity (15, 30, or 60)
   * @returns {Array<string>} Array of time slot labels ("7:00 AM", "7:15 AM", etc.)
   */
  generateTimeSlots(startDate, endDate, granularityMinutes = null) {
    const granularity =
      granularityMinutes || this.userPreferences.timeGranularity;
    const slots = [];
    const current = new Date(startDate);

    // Start at 6:00 AM for hockey scheduling
    current.setHours(6, 0, 0, 0);

    while (current <= endDate && current.getHours() < 23) {
      slots.push(this._formatTimeSlot(new Date(current)));
      current.setMinutes(current.getMinutes() + granularity);
    }

    return slots;
  }

  /**
   * Get all time slots for a day (used in day view)
   *
   * @returns {Array<string>} Array of time slot labels for entire day
   */
  getDayTimeSlots() {
    const slots = [];
    const date = new Date();
    date.setHours(6, 0, 0, 0);

    for (
      let i = 0;
      i < (23 - 6) * 60;
      i += this.userPreferences.timeGranularity
    ) {
      slots.push(this._formatTimeSlot(date));
      date.setMinutes(date.getMinutes() + this.userPreferences.timeGranularity);
    }

    return slots;
  }

  // ===== FILTERING & SORTING =====

  /**
   * Apply filters to events
   *
   * @param {Array} events - Array of events to filter
   * @param {Object} filters - Filters to apply
   * @returns {Array} Filtered events
   */
  filterEvents(events, filters = {}) {
    let result = [...events];

    // Filter by teams
    if (filters.teams && filters.teams.length > 0) {
      result = result.filter((e) => {
        // For Games: check home or away team
        if (e.type === "Game") {
          return (
            filters.teams.includes(e.homeTeamId) ||
            filters.teams.includes(e.awayTeamId)
          );
        }
        // For Practice/Tryout: check team or division
        return (
          filters.teams.includes(e.teamId) ||
          filters.teams.includes(e.divisionId)
        );
      });
    }

    // Filter by event types
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      result = result.filter((e) => filters.eventTypes.includes(e.type));
    }

    // Filter by arenas
    if (filters.arenas && filters.arenas.length > 0) {
      result = result.filter((e) => filters.arenas.includes(e.arenaId));
    }

    // Filter by divisions
    if (filters.divisions && filters.divisions.length > 0) {
      result = result.filter((e) => filters.divisions.includes(e.divisionId));
    }

    // Hide past events if requested
    if (filters.hidePastEvents) {
      const now = new Date();
      result = result.filter((e) => new Date(e.startDateTime) >= now);
    }

    // Sort by date
    result.sort(
      (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
    );

    return result;
  }

  // ===== CONFLICT DETECTION =====

  /**
   * Detect conflicts for a potential event
   *
   * @param {String} eventId - Event ID to reschedule (exclude from conflict check)
   * @param {Date} startDateTime - New start time
   * @param {Number} durationMinutes - Duration of event
   * @param {String} arenaId - Arena ID
   * @returns {Promise<Array>} Array of conflicting events
   */
  async detectConflicts(eventId, startDateTime, durationMinutes, arenaId) {
    try {
      const endDateTime = new Date(
        startDateTime.getTime() + durationMinutes * 60000
      );

      const conflicts = await this._callApex("getConflictingEvents", {
        eventId,
        startDateTime: this._formatDateTime(startDateTime),
        endDateTime: this._formatDateTime(endDateTime),
        arenaId
      });

      return conflicts || [];
    } catch (error) {
      console.error("Error detecting conflicts:", error);
      return [];
    }
  }

  // ===== EVENT MANAGEMENT =====

  /**
   * Reschedule an event to a new date/time
   *
   * @param {String} eventId - Event ID
   * @param {Date} newStartDateTime - New start date/time
   * @returns {Promise<Object>} Result with success flag
   */
  async rescheduleEvent(eventId, newStartDateTime) {
    try {
      await this._callApex("rescheduleEvent", {
        eventId,
        newStartDateTime: this._formatDateTime(newStartDateTime)
      });

      // Invalidate cache
      this.clearCache();

      // Publish event
      this.publish("eventRescheduled", { eventId, newStartDateTime });

      return { success: true };
    } catch (error) {
      console.error("Error rescheduling event:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create new event from calendar
   *
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  async createEvent(eventData) {
    try {
      const newEvent = await this._callApex("createEvent", eventData);

      // Invalidate cache
      this.clearCache();

      // Publish event
      this.publish("eventCreated", newEvent);

      return newEvent;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  // ===== EVENT POSITIONING =====

  /**
   * Calculate position and size for event block in grid
   *
   * @param {Object} event - Calendar event
   * @param {Array} timeSlots - Array of available time slots
   * @returns {Object} Position info {top, height, slotIndex, slotSpan}
   */
  calculateEventPosition(event, timeSlots) {
    const startTime = new Date(event.startDateTime);
    const endTime = new Date(event.endDateTime);
    const slotHeightPx = 60; // 60px per time slot

    // Find starting slot
    let startSlotIndex = timeSlots.findIndex((slot) => {
      const slotTime = this._parseTimeSlot(slot);
      return (
        slotTime.hours === startTime.getHours() &&
        slotTime.minutes === startTime.getMinutes()
      );
    });

    if (startSlotIndex === -1) {
      startSlotIndex = 0;
    }

    // Calculate span (number of slots event occupies)
    const eventDurationMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const slotSpan = Math.ceil(
      eventDurationMinutes / this.userPreferences.timeGranularity
    );

    return {
      top: startSlotIndex * slotHeightPx,
      height: Math.max(slotSpan * slotHeightPx, slotHeightPx), // Minimum 1 slot height
      slotIndex: startSlotIndex,
      slotSpan
    };
  }

  // ===== USER PREFERENCES =====

  /**
   * Update user preferences
   *
   * @param {Object} prefs - Preference updates
   */
  updatePreferences(prefs) {
    this.userPreferences = { ...this.userPreferences, ...prefs };
    this.publish("preferencesUpdated", this.userPreferences);
  }

  /**
   * Get current preferences
   *
   * @returns {Object} User preferences
   */
  getPreferences() {
    return { ...this.userPreferences };
  }

  // ===== EVENT BUS / SUBSCRIPTIONS =====

  /**
   * Subscribe to service events
   *
   * @param {String} event - Event name
   * @param {Function} callback - Callback function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
  }

  /**
   * Unsubscribe from service events
   *
   * @param {String} event - Event name
   * @param {Function} callback - Callback function
   */
  unsubscribe(event, callback) {
    if (this.subscribers.has(event)) {
      const callbacks = this.subscribers.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Publish event to subscribers
   *
   * @param {String} event - Event name
   * @param {*} data - Event data
   */
  publish(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber for event ${event}:`, error);
        }
      });
    }
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   *
   * @param {String} key - Cache key
   */
  clearCacheEntry(key) {
    this.cache.delete(key);
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache stats {size, keys, expiredCount}
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      expiredCount: Array.from(this.cache.entries()).filter(([, value]) =>
        this._isCacheExpired(value)
      ).length
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Generate cache key from date range and filters
   *
   * @private
   */
  _generateCacheKey(startDate, endDate, filters) {
    const filterString = JSON.stringify(filters || {});
    return `${this._formatDate(startDate)}-${this._formatDate(endDate)}-${filterString}`;
  }

  /**
   * Check if cache entry is expired (5 minutes TTL)
   *
   * @private
   */
  _isCacheExpired(cacheKey) {
    if (typeof cacheKey === "string") {
      return false; // Key is string, not cache entry
    }
    const ttlSeconds = 300; // 5 minutes
    return (
      cacheKey.timestamp && Date.now() - cacheKey.timestamp > ttlSeconds * 1000
    );
  }

  /**
   * Call Apex controller method
   *
   * @private
   */
  async _callApex(method, params) {
    // This will be injected by the component using this service
    // For now, return mock data for testing
    if (!window.CalendarController || !window.CalendarController[method]) {
      throw new Error(`CalendarController.${method} not available`);
    }
    return window.CalendarController[method](params);
  }

  /**
   * Format date as ISO string
   *
   * @private
   */
  _formatDate(date) {
    if (typeof date === "string") return date;
    return date.toISOString().split("T")[0];
  }

  /**
   * Format datetime as ISO string
   *
   * @private
   */
  _formatDateTime(date) {
    if (typeof date === "string") return date;
    return date.toISOString();
  }

  /**
   * Format time slot as readable string (e.g., "7:00 AM")
   *
   * @private
   */
  _formatTimeSlot(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  /**
   * Parse time slot string back to hours and minutes
   *
   * @private
   */
  _parseTimeSlot(timeSlotString) {
    const match = timeSlotString.match(/(\d+):(\d+)\s(AM|PM)/);
    if (!match) return { hours: 0, minutes: 0 };

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];

    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return { hours, minutes };
  }
}
