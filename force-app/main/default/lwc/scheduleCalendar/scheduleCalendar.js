import { LightningElement, track } from "lwc";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
import FULLCALENDAR from "@salesforce/resourceUrl/fullcalendar";
import getEvents from "@salesforce/apex/ScheduleCalendarController.getEvents";
import updateEvent from "@salesforce/apex/ScheduleCalendarController.updateEvent";
import deleteEvent from "@salesforce/apex/ScheduleCalendarController.deleteEvent";

export default class ScheduleCalendar extends LightningElement {
  @track calendarInitialized = false;
  @track showEventModal = false;
  @track showErrorModal = false;
  @track selectedEvent = null;
  @track errorMessage = "";
  @track isLoading = false;
  @track calendarTitle = "";

  calendar = null;

  renderedCallback() {
    if (this.calendarInitialized) {
      return;
    }

    this.calendarInitialized = true;

    Promise.all([
      loadScript(this, FULLCALENDAR + "/fullcalendar.min.js"),
      loadStyle(this, FULLCALENDAR + "/fullcalendar.min.css")
    ])
      .then(() => {
        this.initializeCalendar();
      })
      .catch((error) => {
        console.error("Error loading FullCalendar", error);
        this.showError("Failed to load calendar. Please refresh the page.");
      });
  }

  initializeCalendar() {
    const calendarEl = this.template.querySelector("#calendar");

    if (!window.FullCalendar) {
      this.showError("FullCalendar library failed to load");
      return;
    }

    this.calendar = new window.FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      headerToolbar: false, // We have custom toolbar
      editable: true,
      eventDrop: this.handleEventDrop.bind(this),
      eventClick: this.handleEventClick.bind(this),
      events: this.fetchEvents.bind(this),
      eventDidMount: this.handleEventDidMount.bind(this),
      height: "auto",
      contentHeight: "auto"
    });

    this.calendar.render();
    this.updateCalendarTitle();
  }

  fetchEvents(info, successCallback, failureCallback) {
    this.isLoading = true;

    getEvents({
      startDate: info.start,
      endDate: info.end
    })
      .then((result) => {
        const events = result.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.startTime,
          end: event.endTime,
          backgroundColor: event.backgroundColor,
          borderColor: event.backgroundColor,
          extendedProps: {
            eventType: event.eventType,
            status: event.status,
            location: event.location
          }
        }));

        successCallback(events);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error("Error fetching events", error);
        failureCallback(error);
        this.isLoading = false;
        this.showError("Failed to load events");
      });
  }

  handleEventDidMount(info) {
    // Add custom styling or tooltips here if needed
    info.el.title = info.event.title;
  }

  handleEventClick(info) {
    this.selectedEvent = {
      id: info.event.id,
      title: info.event.title,
      startTime: info.event.start,
      endTime: info.event.end,
      eventType: info.event.extendedProps.eventType,
      status: info.event.extendedProps.status,
      location: info.event.extendedProps.location
    };
    this.showEventModal = true;
  }

  handleEventDrop(info) {
    const eventType = info.event.extendedProps.eventType;
    const recordId = info.event.id;
    const newDateTime = info.event.start;
    const duration = this.calculateDurationMinutes(
      info.event.start,
      info.event.end
    );

    updateEvent({
      objectType: eventType,
      recordId: recordId,
      newDateTime: newDateTime,
      newDuration: duration
    })
      .then(() => {
        // Event updated successfully
        this.calendar.refetchEvents();
      })
      .catch((error) => {
        console.error("Error updating event", error);
        this.showError(error.body?.message || "Failed to update event");
        // Revert the event to original position
        info.revert();
      });
  }

  handleTodayClick() {
    if (this.calendar) {
      this.calendar.today();
      this.updateCalendarTitle();
    }
  }

  handlePreviousClick() {
    if (this.calendar) {
      this.calendar.prev();
      this.updateCalendarTitle();
    }
  }

  handleNextClick() {
    if (this.calendar) {
      this.calendar.next();
      this.updateCalendarTitle();
    }
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
      const eventType = this.selectedEvent.eventType;
      const recordId = this.selectedEvent.id;

      deleteEvent({
        objectType: eventType,
        recordId: recordId
      })
        .then(() => {
          this.showEventModal = false;
          if (this.calendar) {
            this.calendar.refetchEvents();
          }
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
    if (this.calendar) {
      const view = this.calendar.view;
      // Format title based on view type (e.g., "October 2025" for month view)
      const start = view.currentStart;

      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
      });

      this.calendarTitle = formatter.format(start);
    }
  }

  calculateDurationMinutes(start, end) {
    if (!start || !end) return 60;
    const diffMs = end - start;
    return Math.round(diffMs / (1000 * 60));
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
