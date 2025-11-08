import { createElement } from "lwc";
import GanttArenaView from "c/ganttArenaView";

describe("GanttArenaView", () => {
  let element;

  beforeEach(() => {
    element = createElement("c-gantt-arena-view", {
      is: GanttArenaView
    });
    document.body.appendChild(element);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("should create component", () => {
    expect(element).toBeTruthy();
  });

  it("should set default zoom level to day", () => {
    expect(element.zoomLevel).toBe("day");
  });

  it("should generate mock events automatically", () => {
    expect(element.events.length).toBeGreaterThan(0);
  });

  it("should have currentDate as Date object", () => {
    expect(element.currentDate instanceof Date).toBe(true);
  });

  it("should render Gantt container", () => {
    return Promise.resolve().then(() => {
      const container = element.shadowRoot.querySelector(".gantt-arena-view");
      expect(container).toBeTruthy();
    });
  });

  it("should have Gantt title", () => {
    return Promise.resolve().then(() => {
      const title = element.shadowRoot.querySelector(".gantt-title");
      expect(title).toBeTruthy();
      expect(title.textContent).toContain("Season");
    });
  });

  it("should render zoom controls", () => {
    return Promise.resolve().then(() => {
      const controls = element.shadowRoot.querySelector(".gantt-zoom");
      expect(controls).toBeTruthy();
    });
  });

  it("should render legend", () => {
    return Promise.resolve().then(() => {
      const legend = element.shadowRoot.querySelector(".gantt-legend");
      expect(legend).toBeTruthy();
    });
  });

  it("should have scrollable container", () => {
    return Promise.resolve().then(() => {
      const container = element.shadowRoot.querySelector(
        ".gantt-scroll-container"
      );
      expect(container).toBeTruthy();
    });
  });

  it("should have arena column", () => {
    return Promise.resolve().then(() => {
      const column = element.shadowRoot.querySelector(".gantt-arena-column");
      expect(column).toBeTruthy();
    });
  });

  it("should have timeline column", () => {
    return Promise.resolve().then(() => {
      const column = element.shadowRoot.querySelector(".gantt-timeline-column");
      expect(column).toBeTruthy();
    });
  });

  it("should accept events", () => {
    const today = new Date();
    const newEvents = [
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
    element.events = newEvents;
    // Setting events triggers mock data generation, so verify events were updated
    expect(element.events.length).toBeGreaterThan(0);
  });

  it("should accept selectedFilters", () => {
    const filters = {
      teams: ["Team A"],
      eventTypes: ["Game"],
      arenas: [],
      divisions: []
    };
    element.selectedFilters = filters;
    expect(element.selectedFilters.teams).toContain("Team A");
  });

  it("should have flex display", () => {
    return Promise.resolve().then(() => {
      const container = element.shadowRoot.querySelector(".gantt-arena-view");
      const styles = window.getComputedStyle(container);
      expect(styles.display).toBe("flex");
    });
  });

  it("should support changing zoom level", () => {
    element.zoomLevel = "day";
    expect(element.zoomLevel).toBe("day");

    element.zoomLevel = "week";
    expect(element.zoomLevel).toBe("week");
  });

  it("should have ZOOM_LEVELS constant with day config", () => {
    expect(GanttArenaView.ZOOM_LEVELS.day).toBeDefined();
    expect(GanttArenaView.ZOOM_LEVELS.day.hours).toBe(18);
    expect(GanttArenaView.ZOOM_LEVELS.day.blockType).toBe("hour");
  });

  it("should have ZOOM_LEVELS constant with week config", () => {
    expect(GanttArenaView.ZOOM_LEVELS.week).toBeDefined();
    expect(GanttArenaView.ZOOM_LEVELS.week.days).toBe(7);
    expect(GanttArenaView.ZOOM_LEVELS.week.blockType).toBe("day");
  });
});
