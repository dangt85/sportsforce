import { LightningElement, track } from "lwc";
import getEvents from "@salesforce/apex/ScheduleCalendarController.getEventsByDateRange";
import deleteEvent from "@salesforce/apex/ScheduleCalendarController.deleteEvent";
import CalendarService from "c/calendarService";

export default class ScheduleCalendar extends LightningElement {
  @track showEventPanel = false;
  @track showErrorModal = false;
  @track selectedEvent = null;
  @track errorMessage = "";
  @track isLoading = false;
  @track isPanelLoading = false;
  @track calendarTitle = "";
  @track currentDate = new Date();
  @track events = [];
  @track currentView = "week"; // 'month', 'week', 'day', or 'gantt'
  @track selectedDate = null;
  @track panelMode = "view"; // 'view' or 'create'
  @track prefilledDate = null;
  @track prefilledStartTime = null;

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

  get monthButtonVariant() {
    return this.isMonthView ? "brand" : "neutral";
  }

  get weekButtonVariant() {
    return this.isWeekView ? "brand" : "neutral";
  }

  get dayButtonVariant() {
    return this.isDayView ? "brand" : "neutral";
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

  // ===== TOOLBAR HANDLERS =====

  handleTodayClick() {
    this.currentDate = new Date();
    this.updateCalendarTitle();
    this.loadEvents();
  }

  handlePreviousClick() {
    const newDate = new Date(this.currentDate);
    if (this.currentView === "month") {
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
    if (this.currentView === "month") {
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

      if (this.currentView === "month") {
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
        this._dispatchEventsUpdated();
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
        this._dispatchEventsUpdated();
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
    this.panelMode = "view";
    this.showEventPanel = true;
  }

  handleTimeSlotClick(event) {
    const { dateTime } = event.detail;

    // Format date as YYYY-MM-DD
    const date = new Date(dateTime);
    this.prefilledDate = date.toISOString().split("T")[0];

    // Format time as HH:mm
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    this.prefilledStartTime = `${hours}:${minutes}`;

    // Open panel in create mode
    this.selectedEvent = null;
    this.panelMode = "create";
    this.showEventPanel = true;
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
    // Open panel in create mode with current date/time
    const now = new Date();
    this.prefilledDate = now.toISOString().split("T")[0];

    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    this.prefilledStartTime = `${hours}:${minutes}`;

    this.selectedEvent = null;
    this.panelMode = "create";
    this.showEventPanel = true;
  }

  handleEditEvent(event) {
    // Get event data from detail if available (from panel)
    const eventData = event?.detail || this.selectedEvent;

    // Open record in Salesforce for editing
    if (eventData && eventData.id) {
      window.open(`/${eventData.id}`, "_blank");
      this.showEventPanel = false;
    }
  }

  handleDeleteEvent(event) {
    // Get event data from detail if available (from panel)
    const eventData = event?.detail || this.selectedEvent;

    if (eventData && eventData.id) {
      this.isPanelLoading = true;
      const eventType = eventData.type || eventData.eventType;
      const recordId = eventData.id;

      deleteEvent({
        objectType: eventType,
        recordId: recordId
      })
        .then(() => {
          this.showEventPanel = false;
          this.isPanelLoading = false;
          this.selectedEvent = null;
          this.loadEvents();
          this.showError("Event deleted successfully");
        })
        .catch((error) => {
          console.error("Error deleting event", error);
          this.isPanelLoading = false;
          this.showError("Failed to delete event");
        });
    }
  }

  handleExportEvent(event) {
    // Get event data from detail if available (from panel)
    const eventData = event?.detail || this.selectedEvent;

    if (eventData) {
      // Create iCalendar format export
      const icsContent = this._generateICalendar(eventData);
      const blob = new Blob([icsContent], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${eventData.title || "event"}.ics`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }

  handleClosePanel() {
    this.showEventPanel = false;
    this.selectedEvent = null;
    this.panelMode = "view";
    this.prefilledDate = null;
    this.prefilledStartTime = null;
  }

  handleSaveEvent(event) {
    const newEventData = event.detail;

    console.log("Creating new event:", newEventData);

    // TODO: Call Apex to create event in Salesforce
    // For now, just add to local events array and close panel
    const mockId = `mock-event-${Date.now()}`;
    const createdEvent = {
      id: mockId,
      ...newEventData,
      startTime: new Date(newEventData.startTime),
      endTime: new Date(newEventData.endTime)
    };

    this.events = [...this.events, createdEvent];
    this.showEventPanel = false;
    this.panelMode = "view";
    this.showError(
      "Event created successfully! (Mock mode - not saved to Salesforce)"
    );
  }

  handleCloseErrorModal() {
    this.showErrorModal = false;
  }

  showError(message) {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  _dispatchEventsUpdated() {
    const event = new CustomEvent("eventsupdated", {
      detail: this.events,
      composed: true,
      bubbles: true
    });
    this.dispatchEvent(event);
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

  _generateICalendar(eventData) {
    const formatICalDate = (date) => {
      const d = new Date(date);
      return (
        d.getUTCFullYear() +
        String(d.getUTCMonth() + 1).padStart(2, "0") +
        String(d.getUTCDate()).padStart(2, "0") +
        "T" +
        String(d.getUTCHours()).padStart(2, "0") +
        String(d.getUTCMinutes()).padStart(2, "0") +
        String(d.getUTCSeconds()).padStart(2, "0") +
        "Z"
      );
    };

    const startDate = formatICalDate(eventData.startTime);
    const endDate = formatICalDate(eventData.endTime);
    const now = formatICalDate(new Date());

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SportsForce//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${eventData.id}@sportsforce
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${eventData.title || "Event"}
LOCATION:${eventData.location || ""}
DESCRIPTION:${eventData.type || ""} - ${eventData.status || ""}
STATUS:${eventData.status === "Cancelled" ? "CANCELLED" : "CONFIRMED"}
END:VEVENT
END:VCALENDAR`;
  }
}
