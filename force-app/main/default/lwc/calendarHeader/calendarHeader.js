import { LightningElement, api } from "lwc";

/**
 * calendarHeader
 *
 * Top-level navigation and view selection component
 * Displays current month/date, navigation controls, and view selector buttons
 *
 * Inputs:
 * @api currentDate - Current selected date
 * @api currentView - Current view (month|week|day|gantt)
 * @api zoomLevel - Zoom level for Gantt view (week|month)
 *
 * Outputs:
 * viewchange - Fires when view changed
 * datechange - Fires when date navigation occurs
 * settingsclick - Fires when settings button clicked
 */

export default class CalendarHeader extends LightningElement {
  @api currentDate = new Date();
  @api currentView = "week";
  @api zoomLevel = "week"; // For Gantt view: 'week' or 'month'

  // ===== COMPUTED PROPERTIES =====

  get displayMonthYear() {
    const dateToDisplay = this.currentDate || new Date();

    // Show week range for:
    // 1. Week view
    // 2. Gantt view with week zoom level
    if (
      this.currentView === "week" ||
      (this.currentView === "gantt" && this.zoomLevel === "week")
    ) {
      return this._getWeekRangeDisplay(dateToDisplay);
    }

    // Otherwise show month/year
    const options = { month: "long", year: "numeric" };
    return dateToDisplay.toLocaleDateString("en-US", options);
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

  get dateInputValue() {
    const dateToDisplay = this.currentDate || new Date();
    return this._formatDateForInput(dateToDisplay);
  }

  get monthButtonVariant() {
    return this.currentView === "month" ? "brand" : "neutral";
  }

  get weekButtonVariant() {
    return this.currentView === "week" ? "brand" : "neutral";
  }

  get dayButtonVariant() {
    return this.currentView === "day" ? "brand" : "neutral";
  }

  get ganttButtonVariant() {
    return this.currentView === "gantt" ? "brand" : "neutral";
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle previous period navigation
   * Goes back 1 week (week view) or 1 month (month view)
   */
  handlePreviousPeriod() {
    const newDate = new Date(this.currentDate);

    if (this.currentView === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (this.currentView === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (this.currentView === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      // Gantt view: navigate by month
      newDate.setMonth(newDate.getMonth() - 1);
    }

    this._dispatchDateChange(newDate);
  }

  /**
   * Handle next period navigation
   */
  handleNextPeriod() {
    const newDate = new Date(this.currentDate);

    if (this.currentView === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (this.currentView === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (this.currentView === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      // Gantt view: navigate by month
      newDate.setMonth(newDate.getMonth() + 1);
    }

    this._dispatchDateChange(newDate);
  }

  /**
   * Handle today button click
   */
  handleTodayClick() {
    this._dispatchDateChange(new Date());
  }

  /**
   * Handle date picker change
   */
  handleDatePickerChange(event) {
    const selectedDateStr = event.target.value;
    if (selectedDateStr) {
      const [year, month, day] = selectedDateStr.split("-");
      const selectedDate = new Date(year, month - 1, day);
      this._dispatchDateChange(selectedDate);
    }
  }

  /**
   * Handle view selection
   */
  handleViewChange(event) {
    const view = event.target.dataset.view;
    if (view) {
      this._dispatchViewChange(view);
    }
  }

  /**
   * Handle settings button click
   */
  handleSettingsClick() {
    this.dispatchEvent(
      new CustomEvent("settingsclick", { bubbles: true, composed: true })
    );
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Dispatch viewchange event
   * Parent component is responsible for updating @api currentView
   * @private
   */
  _dispatchViewChange(view) {
    this.dispatchEvent(
      new CustomEvent("viewchange", {
        detail: view,
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Dispatch datechange event
   * Parent component is responsible for updating @api currentDate
   * @private
   */
  _dispatchDateChange(newDate) {
    this.dispatchEvent(
      new CustomEvent("datechange", {
        detail: newDate,
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Format date for HTML date input (YYYY-MM-DD)
   * @private
   */
  _formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
