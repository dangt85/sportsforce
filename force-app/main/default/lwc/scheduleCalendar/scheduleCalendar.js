import { LightningElement, track } from "lwc";
import getEvents from "@salesforce/apex/ScheduleCalendarController.getEventsByDateRange";
import deleteEvent from "@salesforce/apex/ScheduleCalendarController.deleteEvent";
import CalendarService from "c/calendarService";

export default class ScheduleCalendar extends LightningElement {
  @track showEventModal = false;
  @track showErrorModal = false;
  @track selectedEvent = null;
  @track errorMessage = "";
  @track isLoading = false;
  @track calendarTitle = "";
  @track currentDate = new Date();
  @track events = [];
  @track currentView = "month"; // 'month', 'week', 'day', or 'gantt'
  @track selectedDate = null;

  // Development flag - set to true to use mock data
  useMockData = true;
  calendarService = new CalendarService(null);

  _selectedFilters = {
    teams: [],
    eventTypes: [],
    arenas: [],
    divisions: []
  };

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

  connectedCallback() {
    this.currentDate = new Date();
    this.updateCalendarTitle();
    this.loadEvents();
  }

  // ===== VIEW SWITCHING =====

  get isMonthView() {
    return this.currentView === "month";
  }

  get isWeekView() {
    return this.currentView === "week";
  }

  get isDayView() {
    return this.currentView === "day";
  }

  get isGanttView() {
    return this.currentView === "gantt";
  }

  get monthButtonVariant() {
    return this.isMonthView ? "brand" : "neutral";
  }

  get weekButtonVariant() {
    return this.isWeekView ? "brand" : "neutral";
  }

  get dayButtonVariant() {
    return this.isDayView ? "brand" : "neutral";
  }

  get ganttButtonVariant() {
    return this.isGanttView ? "brand" : "neutral";
  }

  handleMonthViewClick() {
    this.currentView = "month";
    this.updateCalendarTitle();
  }

  handleWeekViewClick() {
    this.currentView = "week";
    this.updateCalendarTitle();
  }

  handleDayViewClick() {
    this.currentView = "day";
    this.updateCalendarTitle();
  }

  handleGanttViewClick() {
    this.currentView = "gantt";
    this.updateCalendarTitle();
  }

  // ===== TOOLBAR HANDLERS =====

  handleTodayClick() {
    this.currentDate = new Date();
    this.updateCalendarTitle();
    this.loadEvents();
  }

  handlePreviousClick() {
    const newDate = new Date(this.currentDate);
    if (this.currentView === "month" || this.currentView === "gantt") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (this.currentView === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (this.currentView === "day") {
      newDate.setDate(newDate.getDate() - 1);
    }
    this.currentDate = newDate;
    this.updateCalendarTitle();
    this.loadEvents();
  }

  handleNextClick() {
    const newDate = new Date(this.currentDate);
    if (this.currentView === "month" || this.currentView === "gantt") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (this.currentView === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (this.currentView === "day") {
      newDate.setDate(newDate.getDate() + 1);
    }
    this.currentDate = newDate;
    this.updateCalendarTitle();
    this.loadEvents();
  }

  // ===== EVENT LOADING =====

  async loadEvents() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      // Calculate date range based on view
      let startDate, endDate;

      if (this.currentView === "month" || this.currentView === "gantt") {
        // Get first day of month
        startDate = new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth(),
          1
        );
        // Get last day of month
        endDate = new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth() + 1,
          0
        );
      } else if (this.currentView === "week") {
        // Week view: Sunday to Saturday
        const date = new Date(this.currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day;
        startDate = new Date(date);
        startDate.setDate(diff);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
      } else {
        // Day view: just the current date
        startDate = new Date(this.currentDate);
        endDate = new Date(this.currentDate);
      }

      // Use mock data for development/testing
      if (this.useMockData) {
        const mockEvents = this.calendarService.generateMockEvents(
          startDate,
          endDate
        );
        this.events = mockEvents.map((event) => ({
          id: event.id,
          title: event.title,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          startDateTime: new Date(event.startTime),
          endDateTime: new Date(event.endTime),
          type: event.type,
          eventType: event.type,
          status: event.status,
          location: event.location,
          arena: event.location,
          team: event.title.split(":")[1]?.trim() || "Unknown",
          division: "Unknown",
          durationMinutes:
            (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60)
        }));
        return;
      }

      // Format dates
      const startDateStr = this._formatDateForApex(startDate);
      const endDateStr = this._formatDateForApex(endDate);

      // Call Apex controller
      const response = await getEvents({
        startDate: startDateStr,
        endDate: endDateStr,
        teamIds: this.selectedFilters.teams,
        eventTypes: this.selectedFilters.eventTypes,
        arenaIds: this.selectedFilters.arenas,
        divisionIds: this.selectedFilters.divisions
      });

      if (response && response.success) {
        this.events = (response.allEvents || []).map((event) => ({
          id: event.id,
          title: event.title,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          type: event.eventType,
          status: event.status,
          location: event.location
        }));
      } else if (response && response.errorMessage) {
        console.error("Apex error:", response.errorMessage);
        this.showError(response.errorMessage);
      } else {
        console.error("Unexpected response:", response);
        this.showError("Failed to load events");
      }
    } catch (error) {
      console.error("Error loading events:", error);
      this.showError(
        error?.body?.message ||
          "Unable to load calendar events. Please try again."
      );
    } finally {
      this.isLoading = false;
    }
  }

  // ===== EVENT HANDLERS =====

  handleDaySelected(event) {
    this.selectedDate = event.detail;
    console.log("Day selected:", this.selectedDate);
  }

  handleEventSelected(event) {
    const eventData = event.detail;
    this.selectedEvent = eventData;
    this.showEventModal = true;
  }

  handleEventDrop(event) {
    const dropDetail = event.detail;
    console.log("Event dropped:", dropDetail);
    // TODO: Update event time in Salesforce
    // For now, just show confirmation
    this.showError(
      `Event rescheduled to ${dropDetail.time} on ${dropDetail.date.toDateString()}`
    );
  }

  handleNewEventClick() {
    // This would open a modal to create a new event
    // For now, we'll show a placeholder message
    this.showError(
      "Event creation form not yet implemented. Please create events directly in Salesforce."
    );
  }

  handleEditEvent() {
    // Open record in Salesforce for editing
    if (this.selectedEvent) {
      window.open(`/${this.selectedEvent.id}`, "_blank");
      this.showEventModal = false;
    }
  }

  handleDeleteEvent() {
    if (this.selectedEvent) {
      const eventType = this.selectedEvent.type;
      const recordId = this.selectedEvent.id;

      deleteEvent({
        objectType: eventType,
        recordId: recordId
      })
        .then(() => {
          this.showEventModal = false;
          this.loadEvents();
        })
        .catch((error) => {
          console.error("Error deleting event", error);
          this.showError("Failed to delete event");
        });
    }
  }

  handleCloseModal() {
    this.showEventModal = false;
    this.selectedEvent = null;
  }

  handleCloseErrorModal() {
    this.showErrorModal = false;
  }

  showError(message) {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  updateCalendarTitle() {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    });

    if (this.currentView === "month") {
      this.calendarTitle = formatter.format(this.currentDate);
    } else if (this.currentView === "week") {
      // For week view, show start and end dates
      const weekStart = this._getWeekStartDate(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
      const endStr = weekEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      this.calendarTitle = `${startStr} – ${endStr}`;
    } else {
      // For day view, show the day and date
      this.calendarTitle = this.currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }
  }

  _formatDateForApex(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  _getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  get formattedStartTime() {
    if (!this.selectedEvent || !this.selectedEvent.startTime) {
      return "";
    }

    const date = new Date(this.selectedEvent.startTime);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}
