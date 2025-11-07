import { LightningElement, track } from "lwc";
import CalendarService from "c/calendarService";

export default class SchedulingContainer extends LightningElement {
  @track currentDate = new Date();
  @track events = [];
  @track selectedFilters = {
    teams: [],
    eventTypes: [],
    arenas: [],
    divisions: []
  };

  calendarService = new CalendarService(null);

  connectedCallback() {
    // Container component for scheduling features
    // Uses lightning-tabset with vertical variant to display:
    // - Schedule Builder (Month/Week calendar views with builder tools)
    // - Gantt (Arena utilization Gantt chart view)
    // - Tryouts (tryout management)
    // - Statistics (player stats dashboard)
    this.loadInitialMockData();
  }

  loadInitialMockData() {
    // Get first day of month
    const startDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    );
    // Get last day of month
    const endDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      0
    );

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
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle events updated from Schedule Calendar
   */
  handleEventsUpdated(event) {
    this.events = event.detail;
  }

  /**
   * Handle filters updated from Schedule Calendar
   */
  handleFiltersUpdated(event) {
    this.selectedFilters = event.detail;
  }

  /**
   * Handle event selection from Gantt view
   */
  handleEventSelected(event) {
    // Event detail contains the selected event
    console.log("Event selected from Gantt:", event.detail);
    // Could dispatch this to a detail panel or modal in future
  }
}
