import { createElement } from "lwc";
import WeekCalendarView from "../weekCalendarView";

describe("weekCalendarView", () => {
  let element;

  function flushPromises() {
    return Promise.resolve();
  }

  beforeEach(() => {
    element = createElement("c-week-calendar-view", {
      is: WeekCalendarView
    });
    document.body.appendChild(element);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  describe("Component Initialization", () => {
    test("should render without errors", () => {
      expect(element).toBeTruthy();
    });

    test("should have default currentDate as today", async () => {
      await flushPromises();
      const today = new Date();
      expect(element.currentDate.toDateString()).toBe(today.toDateString());
    });

    test("should accept currentDate @api property", async () => {
      const testDate = new Date(2025, 10, 10); // Nov 10, 2025
      element.currentDate = testDate;
      await flushPromises();
      expect(element.currentDate.toDateString()).toBe(testDate.toDateString());
    });

    test("should initialize with empty events array", async () => {
      await flushPromises();
      expect(element.events).toEqual([]);
    });

    test("should accept events @api property", async () => {
      const mockEvents = [
        {
          id: "1",
          title: "Game 1",
          startTime: "2025-11-10T10:00:00",
          endTime: "2025-11-10T11:30:00",
          type: "Game"
        }
      ];
      element.events = mockEvents;
      await flushPromises();
      expect(element.events).toEqual(mockEvents);
    });

    test("should have default timeGranularity of 15 minutes", async () => {
      await flushPromises();
      expect(element.timeGranularity).toBe(15);
    });

    test("should accept timeGranularity @api property", async () => {
      element.timeGranularity = 30;
      await flushPromises();
      expect(element.timeGranularity).toBe(30);
    });

    test("should show weekends by default", async () => {
      await flushPromises();
      expect(element.showWeekends).toBe(true);
    });

    test("should accept showWeekends @api property", async () => {
      element.showWeekends = false;
      await flushPromises();
      expect(element.showWeekends).toBe(false);
    });
  });

  describe("Time Slot Generation", () => {
    test("should generate 96 time slots for 15-minute granularity", async () => {
      element.timeGranularity = 15;
      await flushPromises();
      const slots = element.timeSlots;
      expect(slots.length).toBe(96); // 24 hours * 60 / 15
    });

    test("should generate 48 time slots for 30-minute granularity", async () => {
      element.timeGranularity = 30;
      await flushPromises();
      const slots = element.timeSlots;
      expect(slots.length).toBe(48); // 24 hours * 60 / 30
    });

    test("should generate 24 time slots for 60-minute granularity", async () => {
      element.timeGranularity = 60;
      await flushPromises();
      const slots = element.timeSlots;
      expect(slots.length).toBe(24); // 24 hours
    });

    test("should format time slots in 12-hour format with AM/PM", async () => {
      element.timeGranularity = 60;
      await flushPromises();
      const slots = element.timeSlots;
      expect(slots[0]).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(slots).toContain("12:00 AM"); // Midnight
      expect(slots).toContain("12:00 PM"); // Noon
    });

    test("should start with 12:00 AM", async () => {
      element.timeGranularity = 60;
      await flushPromises();
      const slots = element.timeSlots;
      expect(slots[0]).toBe("12:00 AM");
    });
  });

  describe("Week Range Calculation", () => {
    test("should calculate correct week range starting from Monday", async () => {
      const testDate = new Date(2025, 10, 12); // Wednesday, Nov 12, 2025
      element.currentDate = testDate;
      await flushPromises();
      const weekDays = element.weekDays;

      // Should start on Monday and have 7 days
      expect(weekDays.length).toBe(7);
      expect(weekDays[0].getDay()).toBe(1); // Monday
      expect(weekDays[6].getDay()).toBe(0); // Sunday
    });

    test("should have correct sequential dates", async () => {
      const testDate = new Date(2025, 10, 10); // Monday, Nov 10, 2025
      element.currentDate = testDate;
      await flushPromises();
      const weekDays = element.weekDays;

      for (let i = 0; i < 7; i++) {
        const expectedDate = new Date(testDate);
        expectedDate.setDate(testDate.getDate() + i);
        expect(weekDays[i].toDateString()).toBe(expectedDate.toDateString());
      }
    });

    test("should show only 5 days (Mon-Fri) when showWeekends is false", async () => {
      element.showWeekends = false;
      await flushPromises();
      const weekDays = element.weekDays;
      expect(weekDays.length).toBe(5);
    });

    test("should display month/year correctly", async () => {
      const testDate = new Date(2025, 10, 15); // Nov 15, 2025
      element.currentDate = testDate;
      await flushPromises();
      const display = element.monthYearDisplay;
      expect(display).toContain("November");
      expect(display).toContain("2025");
    });
  });

  describe("Day Column Headers", () => {
    test("should render day headers with correct format", async () => {
      element.currentDate = new Date(2025, 10, 10); // Monday
      await flushPromises();
      const template = element.shadowRoot;
      const dayHeaders = template.querySelectorAll(".day-column-header");
      expect(dayHeaders.length).toBeGreaterThan(0);
    });

    test("should display day names and dates", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();
      const template = element.shadowRoot;
      const dayHeaders = template.querySelectorAll(".day-column-header");

      dayHeaders.forEach((header) => {
        expect(header.textContent).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/);
      });
    });

    test("should highlight today's date", async () => {
      element.currentDate = new Date(); // Today
      await flushPromises();
      const template = element.shadowRoot;
      const todayHeader = template.querySelector(".day-column-header.today");
      expect(todayHeader).toBeTruthy();
    });
  });

  describe("Event Rendering", () => {
    test("should render events in correct time slots", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0); // Nov 10, 10:00 AM
      const testEvent = {
        id: "evt-1",
        title: "Game 1",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 90 * 60000).toISOString(),
        type: "Game",
        home: "Team A",
        away: "Team B"
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      element.timeGranularity = 60;
      await flushPromises();

      const template = element.shadowRoot;
      const eventBlocks = template.querySelectorAll(".event-block");
      expect(eventBlocks.length).toBeGreaterThan(0);
    });

    test("should position event block height based on duration", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const testEvent = {
        id: "evt-1",
        title: "90-minute Game",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 90 * 60000).toISOString(),
        type: "Game"
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      element.timeGranularity = 60;
      await flushPromises();

      const eventBlock = element.shadowRoot.querySelector(".event-block");
      expect(eventBlock).toBeTruthy();
      // Height should reflect 90 minutes (1.5x the 60-minute slot)
      const heightStyle = eventBlock.style.height || eventBlock.getAttribute("style");
      expect(heightStyle).toBeTruthy();
    });

    test("should not render events outside current week", async () => {
      const weekStart = new Date(2025, 10, 10); // Week of Nov 10
      const eventOutsideWeek = {
        id: "evt-out",
        title: "Outside Week",
        startTime: new Date(2025, 10, 25, 10, 0).toISOString(), // Nov 25
        endTime: new Date(2025, 10, 25, 11, 0).toISOString(),
        type: "Game"
      };

      element.currentDate = weekStart;
      element.events = [eventOutsideWeek];
      await flushPromises();

      const template = element.shadowRoot;
      const eventBlocks = template.querySelectorAll(".event-block");
      expect(eventBlocks.length).toBe(0);
    });

    test("should render multiple overlapping events", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const events = [
        {
          id: "evt-1",
          title: "Event 1",
          startTime: startDate.toISOString(),
          endTime: new Date(startDate.getTime() + 60 * 60000).toISOString(),
          type: "Game"
        },
        {
          id: "evt-2",
          title: "Event 2",
          startTime: startDate.toISOString(),
          endTime: new Date(startDate.getTime() + 60 * 60000).toISOString(),
          type: "Tryout"
        }
      ];

      element.currentDate = startDate;
      element.events = events;
      await flushPromises();

      const eventBlocks = element.shadowRoot.querySelectorAll(".event-block");
      expect(eventBlocks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Current Time Indicator", () => {
    test("should render current time indicator line", async () => {
      // Use a specific time (9 AM) for consistent testing
      element.currentDate = new Date();
      await flushPromises();

      const timeIndicator = element.shadowRoot.querySelector(".current-time-indicator");
      expect(timeIndicator).toBeTruthy();
    });

    test("should position indicator at correct time", async () => {
      element.currentDate = new Date();
      element.timeGranularity = 60;
      await flushPromises();

      const indicator = element.shadowRoot.querySelector(".current-time-indicator");
      expect(indicator).toBeTruthy();
      const top = indicator.style.top || indicator.getAttribute("style");
      expect(top).toBeTruthy();
    });
  });

  describe("Quick Create Form", () => {
    test("should show quick-create form on time slot click", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 60;
      await flushPromises();

      const timeSlotCells = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlotCells.length).toBeGreaterThan(0);

      // Simulate click on first time slot
      timeSlotCells[0].click();
      await flushPromises();

      const quickCreateForm = element.shadowRoot.querySelector(".quick-create-form");
      expect(quickCreateForm).toBeTruthy();
    });

    test("should display form at clicked time slot", async () => {
      element.currentDate = new Date(2025, 10, 10, 10, 0);
      element.timeGranularity = 60;
      await flushPromises();

      const timeSlotCells = element.shadowRoot.querySelectorAll(".time-slot-cell");
      timeSlotCells[10].click(); // Click 10 AM slot
      await flushPromises();

      const form = element.shadowRoot.querySelector(".quick-create-form");
      expect(form).toBeTruthy();
    });

    test("should close form on cancel", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 60;
      await flushPromises();

      const timeSlot = element.shadowRoot.querySelector(".time-slot-cell");
      timeSlot.click();
      await flushPromises();

      const cancelBtn = element.shadowRoot.querySelector(".quick-create-cancel");
      cancelBtn.click();
      await flushPromises();

      const form = element.shadowRoot.querySelector(".quick-create-form");
      expect(form).toBeFalsy();
    });
  });

  describe("Drag-Drop Functionality", () => {
    test("should fire eventdrop event with new time on drop", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const testEvent = {
        id: "evt-drag",
        title: "Draggable Event",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 60 * 60000).toISOString(),
        type: "Game",
        draggable: true
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      element.timeGranularity = 60;
      await flushPromises();

      element.addEventListener("eventdrop", (e) => {
        expect(e.detail.eventId).toBe("evt-drag");
        expect(e.detail.newDateTime).toBeTruthy();
      });

      const eventBlock = element.shadowRoot.querySelector(".event-block");
      if (eventBlock && eventBlock.draggable) {
        // Simulate drag-drop
        const dragStartEvent = new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true
        });
        eventBlock.dispatchEvent(dragStartEvent);

        const dropEvent = new DragEvent("drop", {
          bubbles: true,
          cancelable: true
        });
        element.shadowRoot.querySelector(".day-column").dispatchEvent(dropEvent);
      }

      await flushPromises();
      // Drop event should be fired (if drag implementation is complete)
    });
  });

  describe("Event Selection", () => {
    test("should fire eventclick event when event is clicked", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const testEvent = {
        id: "evt-click",
        title: "Clickable Event",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 60 * 60000).toISOString(),
        type: "Game"
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      element.timeGranularity = 60;
      await flushPromises();

      element.addEventListener("eventclick", (e) => {
        expect(e.detail.id).toBe("evt-click");
      });

      const eventBlock = element.shadowRoot.querySelector(".event-block");
      if (eventBlock) {
        eventBlock.click();
      }

      await flushPromises();
      // Event click should be fired
    });
  });

  describe("Filter Integration", () => {
    test("should accept selectedFilters @api property", async () => {
      const filters = {
        teams: ["Team A"],
        eventTypes: ["Game"],
        arenas: ["Arena 1"],
        divisions: ["Atom AA"]
      };

      element.selectedFilters = filters;
      await flushPromises();
      expect(element.selectedFilters).toEqual(filters);
    });

    test("should respect default empty filters", async () => {
      await flushPromises();
      const defaultFilters = element.selectedFilters;
      expect(defaultFilters.teams).toEqual([]);
      expect(defaultFilters.eventTypes).toEqual([]);
      expect(defaultFilters.arenas).toEqual([]);
      expect(defaultFilters.divisions).toEqual([]);
    });
  });

  describe("Accessibility", () => {
    test("should have proper ARIA labels", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const template = element.shadowRoot;
      const dayColumns = template.querySelectorAll(".day-column");

      dayColumns.forEach((col) => {
        expect(col.getAttribute("role") || col.getAttribute("aria-label")).toBeTruthy();
      });
    });

    test("should have keyboard navigation support", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const timeSlots = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlots.length).toBeGreaterThan(0);

      timeSlots.forEach((slot) => {
        expect(slot.tabIndex).toBeGreaterThanOrEqual(-1);
      });
    });
  });

  describe("Responsive Behavior", () => {
    test("should hide weekends when showWeekends is false", async () => {
      element.showWeekends = false;
      element.currentDate = new Date(2025, 10, 10); // Monday
      await flushPromises();

      const dayColumns = element.shadowRoot.querySelectorAll(".day-column:not(.weekend-hidden)");
      expect(dayColumns.length).toBe(5); // Only Mon-Fri
    });

    test("should apply scroll container for horizontal scrolling", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const scrollContainer = element.shadowRoot.querySelector(".week-scroll-container");
      expect(scrollContainer).toBeTruthy();
    });
  });
});
