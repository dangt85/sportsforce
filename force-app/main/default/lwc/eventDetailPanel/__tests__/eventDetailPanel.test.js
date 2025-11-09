import { createElement } from "lwc";
import EventDetailPanel from "c/eventDetailPanel";

describe("eventDetailPanel", () => {
  let element;

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    // Clean up event listeners
    jest.clearAllMocks();
  });

  function flushPromises() {
    return Promise.resolve();
  }

  beforeEach(() => {
    element = createElement("c-event-detail-panel", {
      is: EventDetailPanel
    });
    document.body.appendChild(element);
  });

  describe("Component Initialization", () => {
    test("should render without errors", () => {
      expect(element).toBeTruthy();
    });

    test("should be hidden by default", async () => {
      await flushPromises();

      const panel = element.shadowRoot.querySelector(".event-detail-panel");
      expect(panel).toBeTruthy();
      expect(panel.classList.contains("event-detail-panel--open")).toBe(false);
    });

    test("should show empty state when no event is provided", async () => {
      await flushPromises();

      const emptyState = element.shadowRoot.querySelector(".empty-state");
      expect(emptyState).toBeTruthy();

      const emptyText = element.shadowRoot.querySelector(".empty-text");
      expect(emptyText.textContent).toBe("No event selected");
    });
  });

  describe("Panel Visibility", () => {
    test("should show panel when isOpen is true", async () => {
      element.isOpen = true;
      await flushPromises();

      const panel = element.shadowRoot.querySelector(".event-detail-panel");
      expect(panel.classList.contains("event-detail-panel--open")).toBe(true);

      const overlay = element.shadowRoot.querySelector(".overlay");
      expect(overlay.classList.contains("overlay--visible")).toBe(true);
    });

    test("should hide panel when isOpen is false", async () => {
      element.isOpen = true;
      await flushPromises();

      element.isOpen = false;
      await flushPromises();

      const panel = element.shadowRoot.querySelector(".event-detail-panel");
      expect(panel.classList.contains("event-detail-panel--open")).toBe(false);

      const overlay = element.shadowRoot.querySelector(".overlay");
      expect(overlay.classList.contains("overlay--visible")).toBe(false);
    });
  });

  describe("Event Details Display", () => {
    const mockEvent = {
      id: "event-1",
      title: "Atoms AA vs Leafs",
      startTime: "2025-11-06T19:30:00Z",
      endTime: "2025-11-06T20:50:00Z",
      type: "Game",
      status: "Scheduled",
      location: "Cinci Arena",
      division: "Atom AA",
      league: "Ontario Hockey"
    };

    test("should display event title", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const title = element.shadowRoot.querySelector(".event-title");
      expect(title.textContent).toBe("Atoms AA vs Leafs");
    });

    test("should display event type badge", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const badge = element.shadowRoot.querySelector(".event-type-badge");
      expect(badge).toBeTruthy();
      expect(badge.classList.contains("event-type-badge--game")).toBe(true);

      const badgeLabel = element.shadowRoot.querySelector(".badge-label");
      expect(badgeLabel.textContent).toBe("GAME");

      const badgeAbbr = element.shadowRoot.querySelector(".badge-abbr");
      expect(badgeAbbr.textContent).toBe("G");
    });

    test("should display formatted date", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const metadataItems =
        element.shadowRoot.querySelectorAll(".metadata-item");
      expect(metadataItems.length).toBeGreaterThan(0);

      // Check that date is displayed (format will vary by locale)
      const dateText = metadataItems[0].querySelector(".metadata-text");
      expect(dateText.textContent).toContain("2025");
    });

    test("should display time range and duration", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const metadataItems =
        element.shadowRoot.querySelectorAll(".metadata-item");

      // Time range is the second metadata item
      const timeText = metadataItems[1].querySelector(".metadata-text");
      expect(timeText.textContent).toContain("PM");
      expect(timeText.textContent).toContain("1 hour 20 minutes");
    });

    test("should display location", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const metadataItems =
        element.shadowRoot.querySelectorAll(".metadata-item");

      // Location is the third metadata item
      const locationText = metadataItems[2].querySelector(".metadata-text");
      expect(locationText.textContent).toBe("Cinci Arena");
    });

    test("should display status badge", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const statusBadge = element.shadowRoot.querySelector("lightning-badge");
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.label).toBe("Scheduled");
    });

    test("should display additional details", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const detailsList = element.shadowRoot.querySelector(".details-list");
      expect(detailsList).toBeTruthy();

      const detailItems = element.shadowRoot.querySelectorAll(".detail-item");
      expect(detailItems.length).toBe(2);

      // Check division
      expect(detailItems[0].textContent).toContain("Division:");
      expect(detailItems[0].textContent).toContain("Atom AA");

      // Check league
      expect(detailItems[1].textContent).toContain("League:");
      expect(detailItems[1].textContent).toContain("Ontario Hockey");
    });
  });

  describe("Event Type Variants", () => {
    test("should display practice badge correctly", async () => {
      element.event = {
        id: "event-2",
        title: "Peewee Practice",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T20:00:00Z",
        type: "Practice",
        status: "Scheduled"
      };
      element.isOpen = true;
      await flushPromises();

      const badge = element.shadowRoot.querySelector(".event-type-badge");
      expect(badge.classList.contains("event-type-badge--practice")).toBe(true);

      const badgeAbbr = element.shadowRoot.querySelector(".badge-abbr");
      expect(badgeAbbr.textContent).toBe("P");
    });

    test("should display tryout badge correctly", async () => {
      element.event = {
        id: "event-3",
        title: "Bantam Tryouts",
        startTime: "2025-11-06T18:00:00Z",
        endTime: "2025-11-06T19:00:00Z",
        type: "Tryout",
        status: "Scheduled"
      };
      element.isOpen = true;
      await flushPromises();

      const badge = element.shadowRoot.querySelector(".event-type-badge");
      expect(badge.classList.contains("event-type-badge--tryout")).toBe(true);

      const badgeAbbr = element.shadowRoot.querySelector(".badge-abbr");
      expect(badgeAbbr.textContent).toBe("T");
    });
  });

  describe("Game-Specific Info", () => {
    test("should display game scores when available", async () => {
      element.event = {
        id: "event-4",
        title: "Championship Game",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T20:30:00Z",
        type: "Game",
        status: "Completed",
        homeScore: 4,
        awayScore: 2
      };
      element.isOpen = true;
      await flushPromises();

      const gameInfo = element.shadowRoot.querySelector(".game-info-section");
      expect(gameInfo).toBeTruthy();

      const scoreValues = element.shadowRoot.querySelectorAll(".score-value");
      expect(scoreValues.length).toBe(2);
      expect(scoreValues[0].textContent).toBe("4");
      expect(scoreValues[1].textContent).toBe("2");
    });

    test("should not display game scores when not available", async () => {
      element.event = {
        id: "event-5",
        title: "Practice Session",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T20:00:00Z",
        type: "Practice",
        status: "Scheduled"
      };
      element.isOpen = true;
      await flushPromises();

      const gameInfo = element.shadowRoot.querySelector(".game-info-section");
      expect(gameInfo).toBeNull();
    });
  });

  describe("Action Buttons", () => {
    const mockEvent = {
      id: "event-1",
      title: "Test Event",
      startTime: "2025-11-06T19:00:00Z",
      endTime: "2025-11-06T20:00:00Z",
      type: "Game",
      status: "Scheduled"
    };

    test("should fire edit event when Edit button clicked", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("edit", handler);

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const editButton = buttons[0]; // First button is Edit
      editButton.click();
      await flushPromises();

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual(mockEvent);
    });

    test("should fire delete event when Delete button clicked", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("delete", handler);

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const deleteButton = buttons[1]; // Second button is Delete
      deleteButton.click();
      await flushPromises();

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual(mockEvent);
    });

    test("should fire export event when Export button clicked", async () => {
      element.event = mockEvent;
      element.isOpen = true;
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("export", handler);

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const exportButton = buttons[2]; // Third button is Export
      exportButton.click();
      await flushPromises();

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual(mockEvent);
    });
  });

  describe("Close Functionality", () => {
    test("should fire close event when close button clicked", async () => {
      element.isOpen = true;
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("close", handler);

      const closeButton = element.shadowRoot.querySelector(
        "lightning-button-icon"
      );
      closeButton.click();
      await flushPromises();

      expect(handler).toHaveBeenCalled();
    });

    test("should fire close event when overlay clicked", async () => {
      element.isOpen = true;
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("close", handler);

      const overlay = element.shadowRoot.querySelector(".overlay");
      overlay.click();
      await flushPromises();

      expect(handler).toHaveBeenCalled();
    });

    test("should fire close event when ESC key pressed", async () => {
      element.isOpen = true;
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("close", handler);

      // Simulate ESC key press
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);
      await flushPromises();

      expect(handler).toHaveBeenCalled();
    });

    test("should not close on ESC when panel is closed", async () => {
      element.isOpen = false;
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("close", handler);

      // Simulate ESC key press
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(event);
      await flushPromises();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    test("should display loading spinner when isLoading is true", async () => {
      element.isLoading = true;
      element.isOpen = true;
      await flushPromises();

      const spinner = element.shadowRoot.querySelector("lightning-spinner");
      expect(spinner).toBeTruthy();
      expect(spinner.alternativeText).toBe("Loading event details");
    });

    test("should hide content when loading", async () => {
      element.isLoading = true;
      element.event = {
        id: "event-1",
        title: "Test Event",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T20:00:00Z",
        type: "Game"
      };
      element.isOpen = true;
      await flushPromises();

      const title = element.shadowRoot.querySelector(".event-title");
      expect(title).toBeNull();

      const spinner = element.shadowRoot.querySelector("lightning-spinner");
      expect(spinner).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    test("should handle event without location", async () => {
      element.event = {
        id: "event-1",
        title: "Test Event",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T20:00:00Z",
        type: "Game",
        status: "Scheduled"
        // No location
      };
      element.isOpen = true;
      await flushPromises();

      const metadataItems =
        element.shadowRoot.querySelectorAll(".metadata-item");
      // Should only have date and time (no location)
      expect(metadataItems.length).toBe(2);
    });

    test("should handle event without status", async () => {
      element.event = {
        id: "event-1",
        title: "Test Event",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T20:00:00Z",
        type: "Game"
        // No status
      };
      element.isOpen = true;
      await flushPromises();

      const statusBadge = element.shadowRoot.querySelector("lightning-badge");
      expect(statusBadge).toBeNull();
    });

    test("should handle short duration events", async () => {
      element.event = {
        id: "event-1",
        title: "Quick Meeting",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T19:15:00Z", // 15 minutes
        type: "Other"
      };
      element.isOpen = true;
      await flushPromises();

      const metadataItems =
        element.shadowRoot.querySelectorAll(".metadata-item");
      const timeText = metadataItems[1].querySelector(".metadata-text");
      expect(timeText.textContent).toContain("15 minutes");
    });

    test("should handle hour-long events", async () => {
      element.event = {
        id: "event-1",
        title: "Standard Practice",
        startTime: "2025-11-06T19:00:00Z",
        endTime: "2025-11-06T20:00:00Z", // 60 minutes
        type: "Practice"
      };
      element.isOpen = true;
      await flushPromises();

      const metadataItems =
        element.shadowRoot.querySelectorAll(".metadata-item");
      const timeText = metadataItems[1].querySelector(".metadata-text");
      expect(timeText.textContent).toContain("1 hour");
    });
  });
});
