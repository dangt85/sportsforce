import { LightningElement, api } from "lwc";

/**
 * eventDetailPanel
 *
 * Slide-out modal panel for viewing/editing event details
 *
 * Features:
 * - Slides in from right with semi-transparent overlay
 * - Shows full event details (title, date, time, location, status)
 * - Action buttons (Edit, Delete, Export)
 * - Click outside or X button to close
 * - Keyboard support (ESC to close)
 * - Accessible with ARIA labels
 *
 * Input Props:
 * @api event - Event object with details {id, title, startTime, endTime, type, status, location, ...}
 * @api isOpen - Boolean to control panel visibility
 * @api isLoading - Boolean to show loading state
 *
 * Output Events:
 * @fires close - When panel is closed (X button or outside click)
 * @fires edit - When Edit button is clicked
 * @fires delete - When Delete button is clicked
 * @fires export - When Export button is clicked (optional)
 */

export default class EventDetailPanel extends LightningElement {
  // ===== API PROPERTIES =====

  @api event = null;
  @api isOpen = false;
  @api isLoading = false;
  @api mode = "view"; // 'view' or 'create'
  @api prefilledDate = null; // Pre-filled date for create mode
  @api prefilledStartTime = null; // Pre-filled start time for create mode

  // ===== LIFECYCLE HOOKS =====

  // Track keyboard listener state
  _keyboardListenerAdded = false;
  _boundKeyDownHandler = null;

  connectedCallback() {
    // Create bound handler once
    this._boundKeyDownHandler = this.handleKeyDown.bind(this);
  }

  renderedCallback() {
    // Add/remove keyboard listener based on panel state
    if (this.isOpen && !this._keyboardListenerAdded) {
      document.addEventListener("keydown", this._boundKeyDownHandler);
      this._keyboardListenerAdded = true;
    } else if (!this.isOpen && this._keyboardListenerAdded) {
      document.removeEventListener("keydown", this._boundKeyDownHandler);
      this._keyboardListenerAdded = false;
    }
  }

  disconnectedCallback() {
    // Clean up keyboard listener
    if (this._keyboardListenerAdded && this._boundKeyDownHandler) {
      document.removeEventListener("keydown", this._boundKeyDownHandler);
      this._keyboardListenerAdded = false;
    }
  }

  // ===== COMPUTED PROPERTIES =====

  /**
   * Check if panel is in create mode
   */
  get isCreateMode() {
    return this.mode === "create";
  }

  /**
   * Check if panel is in view mode
   */
  get isViewMode() {
    return this.mode === "view";
  }

  /**
   * Check if event data is available
   */
  get hasEvent() {
    return this.event !== null && this.event !== undefined;
  }

  /**
   * Get formatted date string (e.g., "Thursday, November 6, 2025")
   */
  get formattedDate() {
    if (!this.event?.startTime) {
      return "";
    }
    const date = new Date(this.event.startTime);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  /**
   * Get formatted time range (e.g., "7:30 PM - 8:50 PM")
   */
  get formattedTimeRange() {
    if (!this.event?.startTime || !this.event?.endTime) {
      return "";
    }
    const startTime = new Date(this.event.startTime);
    const endTime = new Date(this.event.endTime);

    const startStr = this.formatTime(startTime);
    const endStr = this.formatTime(endTime);

    return `${startStr} - ${endStr}`;
  }

  /**
   * Get event duration in minutes
   */
  get durationMinutes() {
    if (!this.event?.startTime || !this.event?.endTime) {
      return 0;
    }
    const start = new Date(this.event.startTime);
    const end = new Date(this.event.endTime);
    return Math.round((end - start) / (1000 * 60));
  }

  /**
   * Get duration display string (e.g., "80 minutes")
   */
  get durationDisplay() {
    const minutes = this.durationMinutes;
    if (minutes === 0) {
      return "";
    }
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (remainingMins === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMins} minutes`;
  }

  /**
   * Get event type badge class
   */
  get eventTypeBadgeClass() {
    const type = this.event?.type?.toLowerCase() || "other";
    return `event-type-badge event-type-badge--${type}`;
  }

  /**
   * Get event type label (e.g., "GAME", "PRACTICE")
   */
  get eventTypeLabel() {
    return this.event?.type?.toUpperCase() || "EVENT";
  }

  /**
   * Get event type abbreviation (e.g., "G", "P", "T")
   */
  get eventTypeAbbr() {
    const type = this.event?.type?.toLowerCase();
    const abbr = {
      game: "G",
      practice: "P",
      tryout: "T",
      tournament: "TO",
      training: "TR",
      other: "E"
    };
    return abbr[type] || "E";
  }

  /**
   * Get event type options for dropdown
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
   * Get status badge variant (based on SLDS)
   */
  get statusVariant() {
    const status = this.event?.status?.toLowerCase();
    const variants = {
      scheduled: "warning",
      "in progress": "success",
      completed: "default",
      cancelled: "error",
      postponed: "warning"
    };
    return variants[status] || "default";
  }

  /**
   * Get panel container class (show/hide)
   */
  get panelClass() {
    return this.isOpen
      ? "event-detail-panel event-detail-panel--open"
      : "event-detail-panel";
  }

  /**
   * Get overlay class (show/hide)
   */
  get overlayClass() {
    return this.isOpen ? "overlay overlay--visible" : "overlay";
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle close button click
   */
  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  /**
   * Handle overlay click (close panel)
   */
  handleOverlayClick() {
    this.handleClose();
  }

  /**
   * Handle edit button click
   */
  handleEdit() {
    this.dispatchEvent(
      new CustomEvent("edit", {
        detail: this.event
      })
    );
  }

  /**
   * Handle delete button click
   */
  handleDelete() {
    this.dispatchEvent(
      new CustomEvent("delete", {
        detail: this.event
      })
    );
  }

  /**
   * Handle export button click
   */
  handleExport() {
    this.dispatchEvent(
      new CustomEvent("export", {
        detail: this.event
      })
    );
  }

  /**
   * Handle save event (create mode)
   */
  handleSaveEvent() {
    // Get form values
    const inputs = this.template.querySelectorAll(
      "lightning-input, lightning-combobox, lightning-textarea"
    );

    const eventData = {};
    inputs.forEach((input) => {
      const label = input.label;
      const value = input.value;

      if (label === "Event Title") {
        eventData.title = value;
      } else if (label === "Event Type") {
        eventData.type = value;
      } else if (label === "Date") {
        eventData.date = value;
      } else if (label === "Start Time") {
        eventData.startTime = value;
      } else if (label === "End Time") {
        eventData.endTime = value;
      } else if (label === "Location") {
        eventData.location = value;
      } else if (label === "Description") {
        eventData.description = value;
      }
    });

    // Validate required fields
    if (
      !eventData.title ||
      !eventData.type ||
      !eventData.date ||
      !eventData.startTime ||
      !eventData.endTime
    ) {
      // Show validation error
      return;
    }

    // Combine date and time into ISO strings
    const startDateTime = new Date(`${eventData.date}T${eventData.startTime}`);
    const endDateTime = new Date(`${eventData.date}T${eventData.endTime}`);

    const newEvent = {
      title: eventData.title,
      type: eventData.type,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      location: eventData.location || "",
      description: eventData.description || "",
      status: "Scheduled"
    };

    // Fire save event
    this.dispatchEvent(
      new CustomEvent("save", {
        detail: newEvent
      })
    );
  }

  /**
   * Handle keyboard events (ESC to close)
   */
  handleKeyDown(event) {
    if (event.key === "Escape" && this.isOpen) {
      this.handleClose();
    }
  }

  /**
   * Prevent panel click from closing (stops propagation to overlay)
   */
  handlePanelClick(event) {
    event.stopPropagation();
  }

  // ===== PRIVATE METHODS =====

  /**
   * Format time to 12-hour format with AM/PM
   */
  formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  }
}
