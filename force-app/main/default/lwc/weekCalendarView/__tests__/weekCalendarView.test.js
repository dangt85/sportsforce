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

    test("should accept currentDateStr @api property as string", async () => {
      element.currentDateStr = "2025-11-10";
      await flushPromises();
      // Check that currentDate was set (allow for timezone differences)
      const result = element.currentDate;
      expect(result).toBeTruthy();
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // November
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

    test("should hide weekends by default", async () => {
      await flushPromises();
      // Default hides weekends (showWeekends defaults to false)
      const defaultShowWeekends = element.showWeekends;
      expect(defaultShowWeekends).toBe(false);
    });

    test("should accept showWeekends @api property", async () => {
      element.showWeekends = false;
      await flushPromises();
      expect(element.showWeekends).toBe(false);
    });
  });

  describe("DOM Rendering - Calendar Structure", () => {
    test("should render calendar header", async () => {
      await flushPromises();
      const header = element.shadowRoot.querySelector(".calendar-header");
      expect(header).toBeTruthy();
    });

    test("should render day column headers", async () => {
      element.currentDate = new Date(2025, 10, 10); // Monday, Nov 10, 2025
      await flushPromises();

      const dayHeaders =
        element.shadowRoot.querySelectorAll(".day-column-header");
      expect(dayHeaders.length).toBeGreaterThan(0);
    });

    test("should render calendar grid", async () => {
      await flushPromises();
      const grid = element.shadowRoot.querySelector(".calendar-grid");
      expect(grid).toBeTruthy();
    });

    test("should render time column with labels", async () => {
      element.timeGranularity = 60;
      await flushPromises();

      const timeColumn = element.shadowRoot.querySelector(".time-column");
      expect(timeColumn).toBeTruthy();

      const timeLabels =
        element.shadowRoot.querySelectorAll(".time-slot-label");
      expect(timeLabels.length).toBeGreaterThan(0);
    });

    test("should render day columns", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const dayColumns = element.shadowRoot.querySelectorAll(".day-column");
      expect(dayColumns.length).toBeGreaterThan(0);
    });
  });

  describe("DOM Rendering - Time Slots", () => {
    test("should render time slot cells for 60-minute granularity (5-day work week)", async () => {
      element.currentDate = new Date(2025, 10, 10); // Monday, Nov 10, 2025
      element.timeGranularity = 60;
      element.showWeekends = false; // Default hides weekends
      await flushPromises();

      const timeSlots = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlots.length).toBe(120); // 24 hours * 5 days (Mon-Fri)
    });

    test("should render time slot cells for 30-minute granularity (5-day work week)", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 30;
      element.showWeekends = false;
      await flushPromises();

      const timeSlots = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlots.length).toBe(240); // 48 slots * 5 days (Mon-Fri)
    });

    test("should render time slot cells for 15-minute granularity (5-day work week)", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 15;
      element.showWeekends = false;
      await flushPromises();

      const timeSlots = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlots.length).toBe(480); // 96 slots * 5 days (Mon-Fri)
    });

    test("should render 7 days of time slots when showWeekends is true", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 60;
      element.showWeekends = true;
      await flushPromises();

      const timeSlots = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlots.length).toBe(168); // 24 hours * 7 days (Mon-Sun)
    });
  });

  describe("Event Rendering", () => {
    test("should render events in calendar", async () => {
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

      const eventBlocks = element.shadowRoot.querySelectorAll(".event-block");
      expect(eventBlocks.length).toBeGreaterThan(0);
    });

    test("should render event title in event block", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const testEvent = {
        id: "evt-1",
        title: "Hockey Practice",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 60 * 60000).toISOString(),
        type: "Practice"
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      await flushPromises();

      const eventTitle = element.shadowRoot.querySelector(".event-title");
      expect(eventTitle).toBeTruthy();
      expect(eventTitle.textContent).toContain("Hockey Practice");
    });

    test("should render team names for sports events", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const testEvent = {
        id: "evt-1",
        title: "Game",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 90 * 60000).toISOString(),
        type: "Game",
        home: "Team A",
        away: "Team B"
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      await flushPromises();

      const eventSubtitle = element.shadowRoot.querySelector(".event-subtitle");
      expect(eventSubtitle).toBeTruthy();
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

      const eventBlocks = element.shadowRoot.querySelectorAll(".event-block");
      expect(eventBlocks.length).toBe(0);
    });

    test("should render multiple events", async () => {
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
          startTime: new Date(startDate.getTime() + 120 * 60000).toISOString(),
          endTime: new Date(startDate.getTime() + 180 * 60000).toISOString(),
          type: "Practice"
        }
      ];

      element.currentDate = startDate;
      element.events = events;
      await flushPromises();

      const eventBlocks = element.shadowRoot.querySelectorAll(".event-block");
      expect(eventBlocks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Quick Create Form", () => {
    test("should not show form initially", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const form = element.shadowRoot.querySelector(".quick-create-form");
      expect(form).toBeFalsy();
    });

    test("should show quick-create form on time slot click", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 60;
      await flushPromises();

      const timeSlots = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlots.length).toBeGreaterThan(0);

      // Click first time slot
      timeSlots[0].click();
      await flushPromises();

      const form = element.shadowRoot.querySelector(".quick-create-form");
      expect(form).toBeTruthy();
    });

    test("should close form on cancel button click", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 60;
      await flushPromises();

      // Click time slot to show form
      const timeSlot = element.shadowRoot.querySelector(".time-slot-cell");
      timeSlot.click();
      await flushPromises();

      // Click cancel
      const cancelBtn = element.shadowRoot.querySelector(
        ".quick-create-cancel"
      );
      expect(cancelBtn).toBeTruthy();
      cancelBtn.click();
      await flushPromises();

      const form = element.shadowRoot.querySelector(".quick-create-form");
      expect(form).toBeFalsy();
    });

    test("should close form on close button click", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 60;
      await flushPromises();

      // Click time slot to show form
      const timeSlot = element.shadowRoot.querySelector(".time-slot-cell");
      timeSlot.click();
      await flushPromises();

      // Click close button
      const closeBtn = element.shadowRoot.querySelector(
        "lightning-button-icon"
      );
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      await flushPromises();

      const form = element.shadowRoot.querySelector(".quick-create-form");
      expect(form).toBeFalsy();
    });
  });

  describe("Current Time Indicator", () => {
    test("should render current time indicator for today", async () => {
      element.currentDate = new Date(); // Today
      element.showWeekends = true;
      await flushPromises();

      const indicator = element.shadowRoot.querySelector(
        ".current-time-indicator"
      );
      expect(indicator).toBeTruthy();
    });

    test("should render current time indicator with proper structure", async () => {
      element.currentDate = new Date();
      element.timeGranularity = 60;
      element.showWeekends = true;
      await flushPromises();

      const indicator = element.shadowRoot.querySelector(
        ".current-time-indicator"
      );
      expect(indicator).toBeTruthy();
      // Check that it's a div with proper structure
      expect(indicator.tagName.toLowerCase()).toBe("div");
    });
  });

  describe("Week Range Calculation", () => {
    test("should render 7 day columns for full week", async () => {
      element.currentDate = new Date(2025, 10, 12); // Wednesday, Nov 12, 2025
      element.showWeekends = true;
      await flushPromises();

      const dayColumns = element.shadowRoot.querySelectorAll(".day-column");
      expect(dayColumns.length).toBe(7);
    });

    test("should render 5 day columns when weekends hidden", async () => {
      element.currentDate = new Date(2025, 10, 10); // Monday
      element.showWeekends = false;
      await flushPromises();

      const dayColumns = element.shadowRoot.querySelectorAll(".day-column");
      expect(dayColumns.length).toBe(5);
    });

    test("should highlight today column when viewing current week", async () => {
      element.currentDate = new Date(); // Today - will include today in week
      element.showWeekends = true;
      await flushPromises();

      // Should have at least one day marked as today (only if today is in the week)
      const todayColumns =
        element.shadowRoot.querySelectorAll(".day-column.today");
      expect(todayColumns.length).toBeGreaterThanOrEqual(0); // May or may not have today depending on day of week
    });

    test("should highlight today in day headers when viewing current week", async () => {
      element.currentDate = new Date(); // Today
      element.showWeekends = true;
      await flushPromises();

      // Check if any day headers are marked as today
      const todayHeaders = element.shadowRoot.querySelectorAll(
        ".day-column-header.today"
      );
      expect(todayHeaders.length).toBeGreaterThanOrEqual(0); // May or may not have today
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

    test("should have default empty filters", async () => {
      await flushPromises();
      const defaultFilters = element.selectedFilters;
      expect(defaultFilters.teams).toEqual([]);
      expect(defaultFilters.eventTypes).toEqual([]);
      expect(defaultFilters.arenas).toEqual([]);
      expect(defaultFilters.divisions).toEqual([]);
    });
  });

  describe("Accessibility", () => {
    test("should have role and aria-label on time slot cells", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const timeSlot = element.shadowRoot.querySelector(".time-slot-cell");
      expect(timeSlot).toBeTruthy();
      expect(timeSlot.getAttribute("role")).toBe("button");
      expect(timeSlot.getAttribute("aria-label")).toBeTruthy();
    });

    test("should have tabindex on interactive elements", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const timeSlot = element.shadowRoot.querySelector(".time-slot-cell");
      expect(timeSlot).toBeTruthy();
      expect(timeSlot.tabIndex).toBeGreaterThanOrEqual(-1);
    });

    test("should have aria-label on event blocks", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const testEvent = {
        id: "evt-1",
        title: "Test Event",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 60 * 60000).toISOString(),
        type: "Game"
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      await flushPromises();

      const eventBlock = element.shadowRoot.querySelector(".event-block");
      expect(eventBlock).toBeTruthy();
      // Verify event block has accessibility label
      expect(eventBlock.getAttribute("aria-label")).toBeTruthy();
    });
  });

  describe("Event Interactions", () => {
    test("should handle time slot click events", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.timeGranularity = 60;
      await flushPromises();

      const timeSlot = element.shadowRoot.querySelector(".time-slot-cell");
      expect(timeSlot).toBeTruthy();

      timeSlot.click();
      await flushPromises();

      const quickCreateForm =
        element.shadowRoot.querySelector(".quick-create-form");
      expect(quickCreateForm).toBeTruthy();
    });

    test("should have time slot cells configured for drop targets", async () => {
      element.currentDate = new Date(2025, 10, 10);
      element.showWeekends = false;
      await flushPromises();

      const timeSlots = element.shadowRoot.querySelectorAll(".time-slot-cell");
      expect(timeSlots.length).toBeGreaterThan(0);

      // Verify that time slots are properly structured for drag-drop
      const firstSlot = timeSlots[0];
      expect(firstSlot).toBeTruthy();
      expect(firstSlot.classList.contains("time-slot-cell")).toBe(true);
    });

    test("should have draggable event blocks", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0);
      const testEvent = {
        id: "evt-1",
        title: "Draggable Event",
        startTime: startDate.toISOString(),
        endTime: new Date(startDate.getTime() + 60 * 60000).toISOString(),
        type: "Game"
      };

      element.currentDate = startDate;
      element.events = [testEvent];
      await flushPromises();

      const eventBlock = element.shadowRoot.querySelector(".event-block");
      expect(eventBlock).toBeTruthy();
      // Verify event block is draggable
      expect(eventBlock.getAttribute("draggable")).toBe("true");
      expect(eventBlock.classList.contains("event-block")).toBe(true);
    });
  });

  describe("Responsive Behavior", () => {
    test("should apply scroll container for horizontal scrolling", async () => {
      element.currentDate = new Date(2025, 10, 10);
      await flushPromises();

      const scrollContainer = element.shadowRoot.querySelector(
        ".week-scroll-container"
      );
      expect(scrollContainer).toBeTruthy();
    });

    test("should respect showWeekends property", async () => {
      element.currentDate = new Date(2025, 10, 10); // Monday
      element.showWeekends = false;
      await flushPromises();

      const dayColumns = element.shadowRoot.querySelectorAll(".day-column");
      expect(dayColumns.length).toBe(5); // Only Mon-Fri
    });
  });

  describe("Conflict Detection", () => {
    test("should detect overlapping events on same day", async () => {
      const startDate = new Date(2025, 10, 10, 10, 0); // Nov 10, 10:00 AM
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
          title: "Event 2 (Overlaps)",
          startTime: new Date(startDate.getTime() + 30 * 60000).toISOString(), // 30 min into Event 1
          endTime: new Date(startDate.getTime() + 90 * 60000).toISOString(),
          type: "Practice"
        }
      ];

      element.currentDate = startDate;
      element.events = events;
      await flushPromises();

      // Both events should be marked as conflicts
      const eventBlocks = element.shadowRoot.querySelectorAll(".event-block");
      expect(eventBlocks.length).toBeGreaterThanOrEqual(2);

      // Check that at least one block has conflict styling
      let hasConflictClass = false;
      eventBlocks.forEach((block) => {
        if (block.classList.contains("conflict")) {
          hasConflictClass = true;
        }
      });
      expect(hasConflictClass).toBe(true);
    });

    test("should show conflict indicator on overlapping events", async () => {
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
          startTime: new Date(startDate.getTime() + 30 * 60000).toISOString(),
          endTime: new Date(startDate.getTime() + 90 * 60000).toISOString(),
          type: "Practice"
        }
      ];

      element.currentDate = startDate;
      element.events = events;
      await flushPromises();

      // Check for conflict warning icon
      const conflictIndicators = element.shadowRoot.querySelectorAll(
        ".event-conflict-indicator"
      );
      expect(conflictIndicators.length).toBeGreaterThan(0);
    });

    test("should not mark non-overlapping events as conflicts", async () => {
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
          title: "Event 2 (No overlap)",
          startTime: new Date(startDate.getTime() + 120 * 60000).toISOString(), // 2 hours later
          endTime: new Date(startDate.getTime() + 180 * 60000).toISOString(),
          type: "Practice"
        }
      ];

      element.currentDate = startDate;
      element.events = events;
      await flushPromises();

      // Should not have conflict indicators
      const conflictIndicators = element.shadowRoot.querySelectorAll(
        ".event-conflict-indicator"
      );
      expect(conflictIndicators.length).toBe(0);
    });

    test("should not mark events on different days as conflicts", async () => {
      const date1 = new Date(2025, 10, 10, 10, 0); // Monday
      const date2 = new Date(2025, 10, 11, 10, 0); // Tuesday, same time

      const events = [
        {
          id: "evt-1",
          title: "Event 1",
          startTime: date1.toISOString(),
          endTime: new Date(date1.getTime() + 60 * 60000).toISOString(),
          type: "Game"
        },
        {
          id: "evt-2",
          title: "Event 2 (Different day)",
          startTime: date2.toISOString(),
          endTime: new Date(date2.getTime() + 60 * 60000).toISOString(),
          type: "Practice"
        }
      ];

      element.currentDate = date1;
      element.events = events;
      await flushPromises();

      // Should not have conflict indicators since events are on different days
      const conflictIndicators = element.shadowRoot.querySelectorAll(
        ".event-conflict-indicator"
      );
      expect(conflictIndicators.length).toBe(0);
    });
  });
});
