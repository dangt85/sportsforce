import { createElement } from "lwc";
import MonthCalendarView from "../monthCalendarView";

describe("monthCalendarView", () => {
  let element;

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  function flushPromises() {
    return Promise.resolve();
  }

  beforeEach(() => {
    element = createElement("c-month-calendar-view", {
      is: MonthCalendarView
    });
    document.body.appendChild(element);
  });

  describe("Component Initialization", () => {
    test("should render without errors", () => {
      expect(element).toBeTruthy();
    });

    test("should display calendar grid for current month", async () => {
      const today = new Date();
      element.currentDate = today;
      await flushPromises();

      const calendarGrid = element.shadowRoot.querySelector(".calendar-grid");
      expect(calendarGrid).toBeTruthy();
    });

    test("should have default currentDate as today", async () => {
      await flushPromises();
      expect(element.currentDate).toBeDefined();
    });

    test("should accept currentDate @api property", async () => {
      const testDate = new Date(2025, 10, 15);
      element.currentDate = testDate;
      await flushPromises();
      expect(element.currentDate.toDateString()).toBe(testDate.toDateString());
    });
  });

  describe("Calendar Grid Structure", () => {
    test("should render days of week header", async () => {
      await flushPromises();
      const dayHeaders = element.shadowRoot.querySelectorAll(
        ".calendar-day-header"
      );
      expect(dayHeaders.length).toBe(7);
    });

    test("should have correct day order (Sun-Sat)", async () => {
      await flushPromises();
      const dayHeaders = element.shadowRoot.querySelectorAll(
        ".calendar-day-header"
      );
      const expectedDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dayHeaders.forEach((header, index) => {
        expect(header.textContent.trim()).toContain(expectedDays[index]);
      });
    });

    test("should render calendar grid for the month", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const calendarGrid = element.shadowRoot.querySelector(".calendar-grid");
      expect(calendarGrid).toBeTruthy();
    });

    test("should have 42 day cells (6 weeks)", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      expect(dayCells.length).toBe(42);
    });

    test("should show previous month's trailing days", async () => {
      element.currentDate = new Date(2025, 10, 1); // November starts on Saturday
      await flushPromises();

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      const firstCell = dayCells[0];
      expect(firstCell.classList.contains("other-month")).toBe(true);
    });

    test("should show next month's leading days", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      const lastCell = dayCells[dayCells.length - 1];
      expect(lastCell.classList.contains("other-month")).toBe(true);
    });

    test("should mark today with special class", async () => {
      const today = new Date();
      element.currentDate = today;
      await flushPromises();

      const todayCell = element.shadowRoot.querySelector(".day-cell.today");
      expect(todayCell).toBeTruthy();
      expect(todayCell.textContent).toContain(today.getDate().toString());
    });
  });

  describe("Event Display", () => {
    test("should accept events @api property", async () => {
      const mockEvents = [
        {
          id: "event1",
          title: "Game 1",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Toronto Maple Leafs",
          type: "Game"
        }
      ];
      element.events = mockEvents;
      await flushPromises();
      expect(element.events).toEqual(mockEvents);
    });

    test("should display events on correct day cells", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Game 1",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Toronto Maple Leafs",
          type: "Game"
        }
      ];
      await flushPromises();

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      let eventFound = false;
      dayCells.forEach((cell) => {
        if (cell.textContent.includes("Game 1")) {
          eventFound = true;
        }
      });
      expect(eventFound).toBe(true);
    });

    test("should display multiple events on same day", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Game 1",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        },
        {
          id: "event2",
          title: "Practice",
          startDateTime: new Date(2025, 10, 15, 18, 0, 0),
          durationMinutes: 90,
          team: "Team A",
          type: "Practice"
        }
      ];
      await flushPromises();

      const eventElements = element.shadowRoot.querySelectorAll(".event-item");
      expect(eventElements.length).toBeGreaterThanOrEqual(2);
    });

    test("should handle empty events array", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [];
      await flushPromises();

      const eventElements = element.shadowRoot.querySelectorAll(".event-item");
      expect(eventElements.length).toBe(0);
    });

    test("should truncate long event titles", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "This is a very long event title that should be truncated",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        }
      ];
      await flushPromises();

      const eventItem = element.shadowRoot.querySelector(".event-item");
      expect(eventItem).toBeTruthy();
      const eventTitle = eventItem.querySelector(".event-title");
      expect(eventTitle).toBeTruthy();
      expect(eventTitle.classList.contains("truncate")).toBe(true);
    });

    test("should color code events by type", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Game",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        },
        {
          id: "event2",
          title: "Practice",
          startDateTime: new Date(2025, 10, 15, 18, 0, 0),
          durationMinutes: 90,
          team: "Team A",
          type: "Practice"
        }
      ];
      await flushPromises();

      const eventItems = element.shadowRoot.querySelectorAll(".event-item");
      expect(eventItems[0].classList.contains("event-game")).toBe(true);
      expect(eventItems[1].classList.contains("event-practice")).toBe(true);
    });
  });

  describe("Event Filtering", () => {
    test("should accept selectedFilters @api property", async () => {
      const mockFilters = {
        teams: ["team1"],
        eventTypes: ["game"],
        arenas: [],
        divisions: []
      };
      element.selectedFilters = mockFilters;
      await flushPromises();
      expect(element.selectedFilters).toEqual(mockFilters);
    });

    test("should filter events by team", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Team A Game",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        },
        {
          id: "event2",
          title: "Team B Game",
          startDateTime: new Date(2025, 10, 15, 18, 0, 0),
          durationMinutes: 60,
          team: "Team B",
          type: "Game"
        }
      ];
      element.selectedFilters = {
        teams: ["Team A"],
        eventTypes: [],
        arenas: [],
        divisions: []
      };
      await flushPromises();

      const eventItems = element.shadowRoot.querySelectorAll(".event-item");
      expect(eventItems.length).toBe(1);
      expect(eventItems[0].textContent).toContain("Team A Game");
    });

    test("should filter events by type", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Game",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        },
        {
          id: "event2",
          title: "Practice",
          startDateTime: new Date(2025, 10, 15, 18, 0, 0),
          durationMinutes: 90,
          team: "Team A",
          type: "Practice"
        }
      ];
      element.selectedFilters = {
        teams: [],
        eventTypes: ["Game"],
        arenas: [],
        divisions: []
      };
      await flushPromises();

      const eventItems = element.shadowRoot.querySelectorAll(".event-item");
      expect(eventItems.length).toBe(1);
      expect(eventItems[0].textContent).toContain("Game");
    });

    test("should show all events when no filters applied", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Game",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        },
        {
          id: "event2",
          title: "Practice",
          startDateTime: new Date(2025, 10, 15, 18, 0, 0),
          durationMinutes: 90,
          team: "Team B",
          type: "Practice"
        }
      ];
      element.selectedFilters = {
        teams: [],
        eventTypes: [],
        arenas: [],
        divisions: []
      };
      await flushPromises();

      const eventItems = element.shadowRoot.querySelectorAll(".event-item");
      expect(eventItems.length).toBe(2);
    });
  });

  describe("Day Selection", () => {
    test("should emit dayselected event when day clicked", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("dayselected", handler);

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      const targetCell = Array.from(dayCells).find((cell) =>
        cell.textContent.trim().includes("15")
      );
      targetCell.click();

      await flushPromises();

      expect(handler).toHaveBeenCalled();
      const selectedDate = handler.mock.calls[0][0].detail;
      expect(selectedDate.getDate()).toBe(15);
    });

    test("should mark selected day with active class", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.selectedDate = new Date(2025, 10, 15);
      await flushPromises();

      const activeCell = element.shadowRoot.querySelector(".day-cell.active");
      expect(activeCell).toBeTruthy();
      expect(activeCell.textContent).toContain("15");
    });

    test("should not allow selecting other month dates", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("dayselected", handler);

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      const otherMonthCell = Array.from(dayCells).find((cell) =>
        cell.classList.contains("other-month")
      );

      // November 2025 has days from October in first week
      expect(otherMonthCell).toBeTruthy();
      otherMonthCell.click();
      await flushPromises();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Responsive Behavior", () => {
    test("should have responsive calendar grid", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const calendarContainer = element.shadowRoot.querySelector(
        ".calendar-container"
      );
      expect(calendarContainer).toBeTruthy();
    });

    test("should display day cells in mobile layout", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      expect(dayCells.length).toBe(42);
      // Each cell should be responsive
      dayCells.forEach((cell) => {
        expect(cell.classList.contains("day-cell")).toBe(true);
      });
    });

    test("should handle window resize", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      window.dispatchEvent(
        new CustomEvent("resize", { bubbles: true, composed: true })
      );
      await flushPromises();

      const calendarGrid = element.shadowRoot.querySelector(".calendar-grid");
      expect(calendarGrid).toBeTruthy();
    });
  });

  describe("Month Navigation", () => {
    test("should display November 2025 calendar grid", async () => {
      element.currentDate = new Date(2025, 10, 15);
      await flushPromises();

      const calendarGrid = element.shadowRoot.querySelector(".calendar-grid");
      expect(calendarGrid).toBeTruthy();
    });

    test("should update calendar grid when month changes", async () => {
      element.currentDate = new Date(2025, 10, 15);
      await flushPromises();

      element.currentDate = new Date(2025, 11, 15);
      await flushPromises();

      const calendarGrid = element.shadowRoot.querySelector(".calendar-grid");
      expect(calendarGrid).toBeTruthy();
    });

    test("should correctly calculate first day of month", async () => {
      element.currentDate = new Date(2025, 10, 1); // Saturday
      await flushPromises();

      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      // November 2025 starts on Saturday (index 6)
      // So first 6 cells should be other-month (October days)
      // Cell 6 (7th cell, 0-indexed) should be November 1st
      const novemberFirstCell = dayCells[6];
      expect(novemberFirstCell).toBeTruthy();
      expect(novemberFirstCell.classList.contains("other-month")).toBe(false);
      expect(
        novemberFirstCell.querySelector(".day-number").textContent
      ).toContain("1");
    });
  });

  describe("Lightning Components Structure", () => {
    test("should use lightning-card for calendar container", async () => {
      await flushPromises();

      const card = element.shadowRoot.querySelector("lightning-card");
      expect(card).toBeTruthy();
    });

    test("should render calendar with proper structure", async () => {
      element.currentDate = new Date(2025, 10, 1);
      await flushPromises();

      const calendarContainer = element.shadowRoot.querySelector(
        ".calendar-container"
      );
      expect(calendarContainer).toBeTruthy();
    });

    test("should have accessible calendar structure", async () => {
      await flushPromises();

      const dayHeaders = element.shadowRoot.querySelector(
        ".calendar-day-headers"
      );
      expect(dayHeaders).toBeTruthy();
    });
  });

  describe("Event Item Rendering", () => {
    test("should display event with title and team", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Championship Game",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Toronto Maple Leafs",
          type: "Game"
        }
      ];
      await flushPromises();

      const eventItem = element.shadowRoot.querySelector(".event-item");
      expect(eventItem).toBeTruthy();
      expect(eventItem.textContent).toContain("Championship Game");
    });

    test("should display event start time", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Game",
          startDateTime: new Date(2025, 10, 15, 14, 30, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        }
      ];
      await flushPromises();

      const eventItem = element.shadowRoot.querySelector(".event-item");
      expect(eventItem).toBeTruthy();
      // Should display time in format like "2:30 PM"
    });

    test("should have event item with click handler", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Game",
          startDateTime: new Date(2025, 10, 15, 14, 0, 0),
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        }
      ];
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("eventselected", handler);

      const eventItem = element.shadowRoot.querySelector(".event-item");
      eventItem.click();

      await flushPromises();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Date Calculations", () => {
    test("should correctly identify event dates", async () => {
      element.currentDate = new Date(2025, 10, 1);
      const eventDate = new Date(2025, 10, 15, 14, 0, 0);
      element.events = [
        {
          id: "event1",
          title: "Game",
          startDateTime: eventDate,
          durationMinutes: 60,
          team: "Team A",
          type: "Game"
        }
      ];
      await flushPromises();

      // Event should be displayed on the 15th
      const dayCells = element.shadowRoot.querySelectorAll(".day-cell");
      let eventOnCorrectDay = false;
      dayCells.forEach((cell) => {
        if (
          cell.textContent.includes("15") &&
          cell.textContent.includes("Game")
        ) {
          eventOnCorrectDay = true;
        }
      });
      expect(eventOnCorrectDay).toBe(true);
    });

    test("should handle events spanning multiple days", async () => {
      element.currentDate = new Date(2025, 10, 1);
      element.events = [
        {
          id: "event1",
          title: "Tournament",
          startDateTime: new Date(2025, 10, 15, 10, 0, 0),
          durationMinutes: 1440, // 24 hours
          team: "Team A",
          type: "Tournament"
        }
      ];
      await flushPromises();

      const eventItems = element.shadowRoot.querySelectorAll(".event-item");
      expect(eventItems.length).toBeGreaterThan(0);
    });
  });
});
