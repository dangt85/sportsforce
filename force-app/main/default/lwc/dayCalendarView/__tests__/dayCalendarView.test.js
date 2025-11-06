import { createElement } from "lwc";
import DayCalendarView from "c/dayCalendarView";

describe("dayCalendarView", () => {
  let element;

  beforeEach(() => {
    element = createElement("c-day-calendar-view", {
      is: DayCalendarView
    });
    document.body.appendChild(element);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  describe("Component Initialization", () => {
    it("should create component", () => {
      expect(element).toBeTruthy();
    });

    it("should initialize with default selected date", () => {
      expect(element.selectedDate).toBeTruthy();
    });

    it("should initialize with empty events array", () => {
      expect(element.events).toEqual([]);
    });

    it("should initialize with default time granularity of 15 minutes", () => {
      expect(element.timeGranularity).toBe(15);
    });

    it("should have default empty filters", () => {
      expect(element.selectedFilters).toEqual({
        teams: [],
        eventTypes: [],
        arenas: [],
        divisions: []
      });
    });
  });

  describe("DOM Rendering - Basic Structure", () => {
    it("should render main day-calendar-view container", () => {
      return Promise.resolve().then(() => {
        const container =
          element.shadowRoot.querySelector(".day-calendar-view");
        expect(container).toBeTruthy();
      });
    });

    it("should render calendar header with date", () => {
      return Promise.resolve().then(() => {
        const header = element.shadowRoot.querySelector(".calendar-header");
        expect(header).toBeTruthy();
      });
    });

    it("should render day title", () => {
      return Promise.resolve().then(() => {
        const title = element.shadowRoot.querySelector(".day-title");
        expect(title).toBeTruthy();
      });
    });

    it("should render scroll container", () => {
      return Promise.resolve().then(() => {
        const container = element.shadowRoot.querySelector(
          ".day-scroll-container"
        );
        expect(container).toBeTruthy();
      });
    });

    it("should render calendar grid", () => {
      return Promise.resolve().then(() => {
        const grid = element.shadowRoot.querySelector(".calendar-grid");
        expect(grid).toBeTruthy();
      });
    });
  });

  describe("DOM Rendering - Time Slots", () => {
    it("should support 15-minute time granularity", () => {
      element.timeGranularity = 15;
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const labels = element.shadowRoot.querySelectorAll(".time-slot-label");
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it("should support 30-minute time granularity", () => {
      element.timeGranularity = 30;
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const labels = element.shadowRoot.querySelectorAll(".time-slot-label");
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it("should support 60-minute time granularity", () => {
      element.timeGranularity = 60;
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const labels = element.shadowRoot.querySelectorAll(".time-slot-label");
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it("should render time slot labels in time column when events exist", () => {
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const labels = element.shadowRoot.querySelectorAll(".time-slot-label");
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it("should render time slot cells for arena columns with events", () => {
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const cells = element.shadowRoot.querySelectorAll(".time-slot-cell");
        expect(cells.length).toBeGreaterThan(0);
      });
    });
  });

  describe("DOM Rendering - Arena Columns", () => {
    beforeEach(() => {
      element.selectedDate = new Date();
    });

    it("should not render arena columns when no events", () => {
      element.events = [];
      return Promise.resolve().then(() => {
        const columns = element.shadowRoot.querySelectorAll(".arena-column");
        expect(columns.length).toBe(0);
      });
    });

    it("should render arena column for each unique arena with events", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        },
        {
          id: "2",
          title: "Practice",
          type: "Practice",
          status: "Scheduled",
          location: "Arena B",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const columns = element.shadowRoot.querySelectorAll(".arena-column");
        expect(columns.length).toBe(2);
      });
    });

    it("should render arena header with name", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Cincinnati Arena",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const header = element.shadowRoot.querySelector(".arena-header");
        expect(header).toBeTruthy();
        expect(header.textContent).toContain("Cincinnati Arena");
      });
    });
  });

  describe("Event Rendering", () => {
    beforeEach(() => {
      element.selectedDate = new Date();
    });

    it("should render events in day calendar", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Test Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const events = element.shadowRoot.querySelectorAll(".event-block");
        expect(events.length).toBe(1);
      });
    });

    it("should render event title in event block", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Arena A vs Arena B",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const title = element.shadowRoot.querySelector(".event-title");
        expect(title.textContent).toContain("Arena A vs Arena B");
      });
    });

    it("should render event time in event block", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const timeBlock = element.shadowRoot.querySelector(".event-time");
        expect(timeBlock).toBeTruthy();
      });
    });

    it("should not render events from different days", () => {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);

      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Tomorrow Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const events = element.shadowRoot.querySelectorAll(".event-block");
        expect(events.length).toBe(0);
      });
    });

    it("should render event with correct type styling", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const event = element.shadowRoot.querySelector(".event-block");
        expect(event.classList.contains("event-game")).toBe(true);
      });
    });
  });

  describe("Quick Create Form", () => {
    beforeEach(() => {
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];
    });

    it("should not show form initially", () => {
      return Promise.resolve().then(() => {
        const form = element.shadowRoot.querySelector(".quick-create-overlay");
        expect(form).toBeFalsy();
      });
    });

    it("should show quick-create form on time slot click", () => {
      return Promise.resolve()
        .then(() => {
          const cell = element.shadowRoot.querySelector(".time-slot-cell");
          if (cell) {
            cell.click();
          }
          return Promise.resolve();
        })
        .then(() => {
          const form = element.shadowRoot.querySelector(
            ".quick-create-overlay"
          );
          expect(form).toBeTruthy();
        });
    });

    it("should close form on cancel button click", () => {
      return Promise.resolve()
        .then(() => {
          const cell = element.shadowRoot.querySelector(".time-slot-cell");
          if (cell) {
            cell.click();
          }
          return Promise.resolve();
        })
        .then(() => {
          const cancelBtn = element.shadowRoot.querySelector(
            ".quick-create-cancel"
          );
          if (cancelBtn) {
            cancelBtn.click();
          }
          return Promise.resolve();
        })
        .then(() => {
          const form = element.shadowRoot.querySelector(
            ".quick-create-overlay"
          );
          expect(form).toBeFalsy();
        });
    });

    it("should close form on close button click", () => {
      return Promise.resolve()
        .then(() => {
          const cell = element.shadowRoot.querySelector(".time-slot-cell");
          if (cell) {
            cell.click();
          }
          return Promise.resolve();
        })
        .then(() => {
          const closeBtn = element.shadowRoot.querySelector(
            "lightning-button-icon"
          );
          if (closeBtn) {
            closeBtn.click();
          }
          return Promise.resolve();
        })
        .then(() => {
          const form = element.shadowRoot.querySelector(
            ".quick-create-overlay"
          );
          expect(form).toBeFalsy();
        });
    });
  });

  describe("Current Time Indicator", () => {
    it("should render current time indicator for today", () => {
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const indicator = element.shadowRoot.querySelector(
          ".current-time-indicator"
        );
        expect(indicator).toBeTruthy();
      });
    });

    it("should not render current time indicator for past dates", () => {
      const yesterday = new Date(Date.now() - 86400000);
      element.selectedDate = yesterday;
      element.events = [
        {
          id: "1",
          title: "Past Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: yesterday.toISOString(),
          endTime: new Date(yesterday.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const indicator = element.shadowRoot.querySelector(
          ".current-time-indicator"
        );
        expect(indicator).toBeFalsy();
      });
    });
  });

  describe("Filter Integration", () => {
    it("should accept selectedFilters @api property", () => {
      const filters = {
        teams: ["team1"],
        eventTypes: ["Game"],
        arenas: ["Arena A"],
        divisions: ["div1"]
      };
      element.selectedFilters = filters;

      expect(element.selectedFilters).toEqual(filters);
    });

    it("should have default empty filters", () => {
      expect(element.selectedFilters).toEqual({
        teams: [],
        eventTypes: [],
        arenas: [],
        divisions: []
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];
    });

    it("should have role and aria-label on time slot cells", () => {
      return Promise.resolve().then(() => {
        const cell = element.shadowRoot.querySelector(".time-slot-cell");
        expect(cell.getAttribute("role")).toBe("button");
        expect(cell.getAttribute("aria-label")).toBeTruthy();
      });
    });

    it("should have tabindex on interactive elements", () => {
      return Promise.resolve().then(() => {
        const cell = element.shadowRoot.querySelector(".time-slot-cell");
        expect(cell.getAttribute("tabindex")).toBe("0");
      });
    });

    it("should have aria-label on event blocks", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Test Event",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const event = element.shadowRoot.querySelector(".event-block");
        expect(event.getAttribute("aria-label")).toBe("Test Event");
      });
    });
  });

  describe("Event Interactions", () => {
    beforeEach(() => {
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];
    });

    it("should handle time slot click events", () => {
      const clickHandler = jest.fn();
      element.addEventListener("timeslotclick", clickHandler);

      return Promise.resolve().then(() => {
        const cell = element.shadowRoot.querySelector(".time-slot-cell");
        if (cell) {
          cell.click();
        }
        expect(clickHandler).toHaveBeenCalled();
      });
    });

    it("should have draggable event blocks", () => {
      return Promise.resolve().then(() => {
        const event = element.shadowRoot.querySelector(".event-block");
        expect(event.getAttribute("draggable")).toBe("true");
      });
    });

    it("should have time slot cells configured for drop targets", () => {
      return Promise.resolve().then(() => {
        const cell = element.shadowRoot.querySelector(".time-slot-cell");
        expect(cell).toBeTruthy();
        // Check that it has data attributes for drop target functionality
        expect(cell.dataset.slotIndex).toBeDefined();
        expect(cell.dataset.arenaIndex).toBeDefined();
      });
    });
  });

  describe("Responsive Behavior", () => {
    beforeEach(() => {
      const today = new Date();
      element.selectedDate = today;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];
    });

    it("should apply scroll container for vertical scrolling", () => {
      return Promise.resolve().then(() => {
        const container = element.shadowRoot.querySelector(
          ".day-scroll-container"
        );
        const styles = window.getComputedStyle(container);
        expect(styles.overflowX).toBe("auto");
        expect(styles.overflowY).toBe("auto");
      });
    });
  });

  describe("Date Display", () => {
    it("should display day with full date format", () => {
      // Create date using local constructor to avoid timezone issues
      const date = new Date(2025, 10, 15); // November 15, 2025 in local timezone
      element.selectedDate = date;
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: date.toISOString(),
          endTime: new Date(date.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const title = element.shadowRoot.querySelector(".day-title");
        const content = title.textContent;
        // Verify the content includes month
        expect(content).toContain("November");
        // Verify it includes a day of the week
        expect(content).toMatch(
          /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/
        );
        // Verify it includes the year
        expect(content).toContain("2025");
      });
    });
  });

  describe("Event Type Styling", () => {
    beforeEach(() => {
      element.selectedDate = new Date();
    });

    it("should apply correct styling for Game events", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Game",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const event = element.shadowRoot.querySelector(".event-block");
        expect(event.classList.contains("event-game")).toBe(true);
      });
    });

    it("should apply correct styling for Practice events", () => {
      const today = new Date();
      element.events = [
        {
          id: "1",
          title: "Practice",
          type: "Practice",
          status: "Scheduled",
          location: "Arena A",
          startTime: today.toISOString(),
          endTime: new Date(today.getTime() + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const event = element.shadowRoot.querySelector(".event-block");
        expect(event.classList.contains("event-practice")).toBe(true);
      });
    });
  });

  describe("Conflict Detection", () => {
    beforeEach(() => {
      element.selectedDate = new Date();
    });

    it("should detect overlapping events in same arena", () => {
      const today = new Date();
      const time1 = today.getTime();
      const time2 = time1 + 1800000; // 30 minutes later

      element.events = [
        {
          id: "1",
          title: "Event 1",
          type: "Game",
          status: "Scheduled",
          location: "Arena A",
          startTime: new Date(time1).toISOString(),
          endTime: new Date(time1 + 3600000).toISOString()
        },
        {
          id: "2",
          title: "Event 2",
          type: "Practice",
          status: "Scheduled",
          location: "Arena A",
          startTime: new Date(time2).toISOString(),
          endTime: new Date(time2 + 3600000).toISOString()
        }
      ];

      return Promise.resolve().then(() => {
        const events = element.shadowRoot.querySelectorAll(".event-block");
        expect(events.length).toBe(2);
        // Both should have conflict indicator since they overlap
        const conflictIndicators = element.shadowRoot.querySelectorAll(
          ".event-conflict-indicator"
        );
        expect(conflictIndicators.length).toBe(2);
      });
    });
  });
});
