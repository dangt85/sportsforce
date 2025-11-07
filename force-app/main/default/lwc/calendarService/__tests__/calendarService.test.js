import CalendarService from "../calendarService";

describe("CalendarService", () => {
  let service;
  const mockLeagueId = "a00xx000001";
  const mockSeasonId = "a01xx000001";

  beforeEach(() => {
    service = new CalendarService(mockLeagueId, mockSeasonId);
  });

  describe("Initialization", () => {
    test("should create service with league and season IDs", () => {
      expect(service.leagueId).toBe(mockLeagueId);
      expect(service.seasonId).toBe(mockSeasonId);
    });

    test("should initialize with default preferences", () => {
      const prefs = service.getPreferences();
      expect(prefs.timeGranularity).toBe(15);
      expect(prefs.showWeekends).toBe(true);
      expect(prefs.theme).toBe("light");
      expect(prefs.defaultView).toBe("week");
    });

    test("should initialize empty cache and subscribers", () => {
      expect(service.cache.size).toBe(0);
      expect(service.subscribers.size).toBe(0);
    });
  });

  describe("Time Slot Generation", () => {
    test("should generate time slots with default granularity (15 min)", () => {
      const startDate = new Date("2025-11-06");
      const endDate = new Date("2025-11-06");
      const slots = service.generateTimeSlots(startDate, endDate);

      // Should generate slots from 6 AM to 11 PM = 17 hours = 68 slots (15-min increments)
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toMatch(/6:00 AM/);
    });

    test("should generate time slots with custom granularity", () => {
      const startDate = new Date("2025-11-06");
      const endDate = new Date("2025-11-06");
      const slots = service.generateTimeSlots(startDate, endDate, 30);

      // 15-min slots would be ~68, 30-min slots should be ~34
      expect(slots.length).toBeLessThan(68);
      expect(slots[0]).toMatch(/6:00 AM/);
    });

    test("should respect user preference granularity", () => {
      service.updatePreferences({ timeGranularity: 60 });
      const slots = service.getDayTimeSlots();

      // Should have fewer slots with 60-min granularity
      expect(slots.length).toBeLessThan(20);
    });

    test("should format time slots correctly", () => {
      const startDate = new Date("2025-11-06");
      const slots = service.generateTimeSlots(startDate, startDate);

      // Check format: "H:MM AM/PM"
      slots.forEach((slot) => {
        expect(slot).toMatch(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
      });
    });
  });

  describe("Event Filtering", () => {
    let mockEvents;

    beforeEach(() => {
      // Use future dates to avoid past event filtering issues
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in future
      const isoDate = futureDate.toISOString().split("T")[0];

      mockEvents = [
        {
          id: "1",
          type: "Game",
          homeTeamId: "team1",
          awayTeamId: "team2",
          arenaId: "arena1",
          divisionId: "div1",
          startDateTime: `${isoDate}T19:00:00Z`
        },
        {
          id: "2",
          type: "Practice",
          teamId: "team1",
          arenaId: "arena2",
          divisionId: "div1",
          startDateTime: `${isoDate}T20:00:00Z`
        },
        {
          id: "3",
          type: "Tryout",
          divisionId: "div2",
          arenaId: "arena1",
          startDateTime: `${isoDate}T21:00:00Z`
        }
      ];
    });

    test("should filter events by team", () => {
      const filtered = service.filterEvents(mockEvents, { teams: ["team1"] });

      expect(filtered.length).toBe(2); // Game (home/away) and Practice
      expect(
        filtered.every((e) => e.type === "Game" || e.type === "Practice")
      ).toBe(true);
    });

    test("should filter events by event type", () => {
      const filtered = service.filterEvents(mockEvents, {
        eventTypes: ["Game"]
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe("Game");
    });

    test("should filter events by arena", () => {
      const filtered = service.filterEvents(mockEvents, { arenas: ["arena1"] });

      expect(filtered.length).toBe(2); // Game and Tryout
      expect(filtered.every((e) => e.arenaId === "arena1")).toBe(true);
    });

    test("should filter events by division", () => {
      const filtered = service.filterEvents(mockEvents, {
        divisions: ["div1"]
      });

      expect(filtered.length).toBe(2); // Game and Practice
      expect(filtered.every((e) => e.divisionId === "div1")).toBe(true);
    });

    test("should combine multiple filters", () => {
      const filtered = service.filterEvents(mockEvents, {
        teams: ["team1"],
        arenas: ["arena1"]
      });

      expect(filtered.length).toBe(1); // Only Game
      expect(filtered[0].id).toBe("1");
    });

    test("should sort events by start date", () => {
      const filtered = service.filterEvents(mockEvents);

      // Check events are sorted in chronological order
      expect(filtered[0].id).toBe("1"); // 19:00
      expect(filtered[1].id).toBe("2"); // 20:00
      expect(filtered[2].id).toBe("3"); // 21:00

      // Verify actual chronological ordering
      expect(
        new Date(filtered[0].startDateTime) <=
          new Date(filtered[1].startDateTime)
      ).toBe(true);
      expect(
        new Date(filtered[1].startDateTime) <=
          new Date(filtered[2].startDateTime)
      ).toBe(true);
    });

    test("should hide past events if requested", () => {
      const pastEvent = {
        id: "4",
        type: "Game",
        startDateTime: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      };

      const filtered = service.filterEvents([...mockEvents, pastEvent], {
        hidePastEvents: true
      });

      expect(filtered.length).toBe(3); // Past event filtered out
      expect(filtered.map((e) => e.id)).not.toContain("4");
    });
  });

  describe("Event Positioning", () => {
    test("should calculate event position in grid", () => {
      const event = {
        startDateTime: "2025-11-06T08:00:00Z",
        endDateTime: "2025-11-06T09:00:00Z"
      };

      const timeSlots = [
        "6:00 AM",
        "6:15 AM",
        "6:30 AM",
        "6:45 AM",
        "7:00 AM",
        "7:15 AM",
        "7:30 AM",
        "7:45 AM",
        "8:00 AM"
      ];

      const position = service.calculateEventPosition(event, timeSlots);

      expect(position.top).toBeGreaterThanOrEqual(0);
      expect(position.height).toBeGreaterThan(0);
      expect(position.slotIndex).toBeGreaterThanOrEqual(0);
      expect(position.slotSpan).toBe(4); // 1 hour = 4 slots (15-min each)
    });

    test("should handle minimum event height", () => {
      const event = {
        startDateTime: "2025-11-06T08:00:00Z",
        endDateTime: "2025-11-06T08:05:00Z" // Only 5 minutes
      };

      const timeSlots = ["8:00 AM", "8:15 AM"];

      const position = service.calculateEventPosition(event, timeSlots);

      expect(position.height).toBeGreaterThanOrEqual(60); // Minimum slot height
    });
  });

  describe("User Preferences", () => {
    test("should update preferences", () => {
      service.updatePreferences({
        timeGranularity: 30,
        theme: "dark"
      });

      const prefs = service.getPreferences();
      expect(prefs.timeGranularity).toBe(30);
      expect(prefs.theme).toBe("dark");
      expect(prefs.showWeekends).toBe(true); // Not updated, should remain
    });

    test("should not modify original preferences object", () => {
      service.updatePreferences({ timeGranularity: 60 });
      const prefs1 = service.getPreferences();
      const prefs2 = service.getPreferences();

      prefs1.theme = "dark";

      expect(prefs2.theme).toBe("light"); // Should not be affected
    });
  });

  describe("Event Bus / Subscriptions", () => {
    test("should subscribe to events", () => {
      const callback = jest.fn();
      service.subscribe("testEvent", callback);

      expect(service.subscribers.has("testEvent")).toBe(true);
    });

    test("should publish events to subscribers", () => {
      const callback = jest.fn();
      service.subscribe("testEvent", callback);

      const testData = { id: "123" };
      service.publish("testEvent", testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    test("should unsubscribe from events", () => {
      const callback = jest.fn();
      service.subscribe("testEvent", callback);
      service.unsubscribe("testEvent", callback);

      service.publish("testEvent", {});

      expect(callback).not.toHaveBeenCalled();
    });

    test("should handle multiple subscribers", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.subscribe("testEvent", callback1);
      service.subscribe("testEvent", callback2);

      const testData = { id: "123" };
      service.publish("testEvent", testData);

      expect(callback1).toHaveBeenCalledWith(testData);
      expect(callback2).toHaveBeenCalledWith(testData);
    });

    test("should handle errors in subscribers gracefully", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Subscriber error");
      });
      const normalCallback = jest.fn();

      service.subscribe("testEvent", errorCallback);
      service.subscribe("testEvent", normalCallback);

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      service.publish("testEvent", {});

      expect(normalCallback).toHaveBeenCalled(); // Should still call other subscribers
      consoleSpy.mockRestore();
    });
  });

  describe("Cache Management", () => {
    test("should clear cache", () => {
      service.cache.set("key1", { events: [] });
      service.cache.set("key2", { events: [] });

      expect(service.cache.size).toBe(2);

      service.clearCache();

      expect(service.cache.size).toBe(0);
    });

    test("should clear specific cache entry", () => {
      service.cache.set("key1", { events: [] });
      service.cache.set("key2", { events: [] });

      service.clearCacheEntry("key1");

      expect(service.cache.has("key1")).toBe(false);
      expect(service.cache.has("key2")).toBe(true);
    });

    test("should provide cache statistics", () => {
      service.cache.set("key1", { events: [], timestamp: Date.now() });
      service.cache.set("key2", { events: [], timestamp: Date.now() });

      const stats = service.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.keys.length).toBe(2);
      expect(stats.expiredCount).toBe(0);
    });
  });

  describe("Helper Functions", () => {
    test("should format date correctly", () => {
      const date = new Date("2025-11-06");
      const formatted = service._formatDate(date);

      expect(formatted).toMatch(/2025-11-06/);
    });

    test("should parse time slot string", () => {
      const parsed = service._parseTimeSlot("8:30 PM");

      expect(parsed.hours).toBe(20);
      expect(parsed.minutes).toBe(30);
    });

    test("should handle 12-hour to 24-hour conversion", () => {
      const parsedAM = service._parseTimeSlot("8:00 AM");
      const parsedPM = service._parseTimeSlot("8:00 PM");
      const parsedMidnight = service._parseTimeSlot("12:00 AM");

      expect(parsedAM.hours).toBe(8);
      expect(parsedPM.hours).toBe(20);
      expect(parsedMidnight.hours).toBe(0);
    });
  });
});
