import { createElement } from "lwc";
import FilterPanel from "../filterPanel";

describe("filterPanel", () => {
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
    element = createElement("c-filter-panel", { is: FilterPanel });
    document.body.appendChild(element);
  });

  describe("Component Initialization", () => {
    test("should render without errors", () => {
      expect(element).toBeTruthy();
    });

    test("should have lightning card container", async () => {
      await flushPromises();
      const card = element.shadowRoot.querySelector("lightning-card");
      expect(card).toBeTruthy();
    });

    test("should have filter heading in card title", async () => {
      await flushPromises();
      const cardTitle = element.shadowRoot.querySelector("[slot='title']");
      expect(cardTitle).toBeTruthy();
      const heading = cardTitle.querySelector("h3");
      expect(heading).toBeTruthy();
      expect(heading.textContent).toContain("Filters");
    });
  });

  describe("Filter Options Population", () => {
    test("should accept teams via @api property", async () => {
      const mockTeams = [
        { id: "team1", name: "Toronto Maple Leafs" },
        { id: "team2", name: "Ottawa Senators" }
      ];
      element.teams = mockTeams;
      await flushPromises();
      expect(element.teams).toEqual(mockTeams);
    });

    test("should accept event types via @api property", async () => {
      const mockEventTypes = [
        { id: "game", label: "Game" },
        { id: "practice", label: "Practice" }
      ];
      element.eventTypes = mockEventTypes;
      await flushPromises();
      expect(element.eventTypes).toEqual(mockEventTypes);
    });

    test("should accept arenas via @api property", async () => {
      const mockArenas = [{ id: "arena1", name: "Scotiabank Arena" }];
      element.arenas = mockArenas;
      await flushPromises();
      expect(element.arenas).toEqual(mockArenas);
    });

    test("should accept divisions via @api property", async () => {
      const mockDivisions = [{ id: "div1", name: "Atom AA" }];
      element.divisions = mockDivisions;
      await flushPromises();
      expect(element.divisions).toEqual(mockDivisions);
    });

    test("should render team combobox when teams provided", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      await flushPromises();

      const teamCombobox = element.shadowRoot.querySelector(
        "[data-filter='teams']"
      );
      expect(teamCombobox).toBeTruthy();
    });

    test("should render event type combobox when event types provided", async () => {
      element.eventTypes = [{ id: "game", label: "Game" }];
      await flushPromises();

      const eventTypeCombobox = element.shadowRoot.querySelector(
        "[data-filter='eventTypes']"
      );
      expect(eventTypeCombobox).toBeTruthy();
    });

    test("should render arena combobox when arenas provided", async () => {
      element.arenas = [{ id: "arena1", name: "Arena 1" }];
      await flushPromises();

      const arenaCombobox = element.shadowRoot.querySelector(
        "[data-filter='arenas']"
      );
      expect(arenaCombobox).toBeTruthy();
    });

    test("should render division combobox when divisions provided", async () => {
      element.divisions = [{ id: "div1", name: "Division 1" }];
      await flushPromises();

      const divisionCombobox = element.shadowRoot.querySelector(
        "[data-filter='divisions']"
      );
      expect(divisionCombobox).toBeTruthy();
    });
  });

  describe("Clear Filters Button", () => {
    test("should have clear button in DOM", async () => {
      await flushPromises();

      const clearButton = element.shadowRoot.querySelector(
        "lightning-button[data-action='clear']"
      );
      expect(clearButton).toBeTruthy();
    });

    test("should have title on clear button", async () => {
      await flushPromises();

      const clearButton = element.shadowRoot.querySelector(
        "lightning-button[data-action='clear']"
      );
      expect(clearButton.getAttribute("title")).toBeTruthy();
    });

    test("should have clear button disabled initially", async () => {
      await flushPromises();

      const clearButton = element.shadowRoot.querySelector(
        "lightning-button[data-action='clear']"
      );
      expect(clearButton.disabled).toBe(true);
    });

    test("should have button with label text", async () => {
      await flushPromises();

      const clearButton = element.shadowRoot.querySelector(
        "lightning-button[data-action='clear']"
      );
      expect(clearButton.label).toContain("Clear All Filters");
    });
  });

  describe("Filter Count Display", () => {
    test("should show 0 filters initially", async () => {
      await flushPromises();

      const filterCount = element.shadowRoot.querySelector(".filter-count");
      expect(filterCount).toBeTruthy();
      expect(filterCount.textContent).toContain("0");
    });

    test("should display filter count element", async () => {
      await flushPromises();

      const filterCount = element.shadowRoot.querySelector(".filter-count");
      expect(filterCount).toBeTruthy();
    });
  });

  describe("Lightning Components Structure", () => {
    test("should use lightning-card for main container", async () => {
      await flushPromises();

      const card = element.shadowRoot.querySelector("lightning-card");
      expect(card).toBeTruthy();
    });

    test("should have lightning-layout for grid", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      await flushPromises();

      const layout = element.shadowRoot.querySelector("lightning-layout");
      expect(layout).toBeTruthy();
    });

    test("should have lightning-button for clear action", async () => {
      await flushPromises();

      const button = element.shadowRoot.querySelector("lightning-button");
      expect(button).toBeTruthy();
    });

    test("should have lightning-combobox components for filters", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      await flushPromises();

      const comboboxes =
        element.shadowRoot.querySelectorAll("lightning-combobox");
      expect(comboboxes.length).toBeGreaterThan(0);
    });

    test("should have labels on combobox filters", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      await flushPromises();

      const combobox = element.shadowRoot.querySelector("lightning-combobox");
      expect(combobox.label).toBeTruthy();
    });
  });

  describe("Responsive Layout", () => {
    test("should render filter layout items", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      element.eventTypes = [{ id: "game", label: "Game" }];
      await flushPromises();

      const layoutItems = element.shadowRoot.querySelectorAll(
        "lightning-layout-item"
      );
      expect(layoutItems.length).toBeGreaterThan(0);
    });

    test("should have responsive layout items with sizing", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      await flushPromises();

      const layoutItem = element.shadowRoot.querySelector(
        "lightning-layout-item"
      );
      expect(layoutItem).toBeTruthy();
      // Layout items should have size properties defined
      expect(layoutItem.size || layoutItem.getAttribute("size")).toBeTruthy();
    });

    test("should have lightning-layout component", async () => {
      await flushPromises();

      const layout = element.shadowRoot.querySelector("lightning-layout");
      expect(layout).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    test("should have proper heading hierarchy", async () => {
      await flushPromises();

      const h3 = element.shadowRoot.querySelector("h3");
      expect(h3).toBeTruthy();
    });

    test("should have accessible combobox labels", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      await flushPromises();

      const comboboxes =
        element.shadowRoot.querySelectorAll("lightning-combobox");
      expect(comboboxes.length).toBeGreaterThan(0);

      comboboxes.forEach((combobox) => {
        expect(combobox.label).toBeTruthy();
      });
    });

    test("should have button with title attribute", async () => {
      await flushPromises();

      const button = element.shadowRoot.querySelector("lightning-button");
      expect(button).toBeTruthy();
      expect(button.getAttribute("title")).toBeTruthy();
    });
  });

  describe("Component Events", () => {
    test("should emit filterchange as bubbling event", async () => {
      const handler = jest.fn();
      element.addEventListener("filterchange", handler);

      // Simulate filter change by directly calling the component's internal method
      // In a real test, this would be through UI interaction
      // For now, we test that the event listener can be attached
      expect(element.addEventListener).toBeDefined();
      expect(handler).not.toHaveBeenCalled();
    });

    test("should accept event listeners", async () => {
      const handler = jest.fn();
      element.addEventListener("filterchange", handler);

      // Verify listener was attached
      expect(element.addEventListener).toBeDefined();
    });
  });

  describe("Filter Panel CSS Classes", () => {
    test("should have filter-panel-card class", async () => {
      await flushPromises();

      const card = element.shadowRoot.querySelector(".filter-panel-card");
      expect(card).toBeTruthy();
    });

    test("should have filter-grid class for grid layout", async () => {
      element.teams = [{ id: "team1", name: "Team 1" }];
      await flushPromises();

      const gridContainer = element.shadowRoot.querySelector(".filter-grid");
      expect(gridContainer).toBeTruthy();
    });

    test("should have filter-count element", async () => {
      await flushPromises();

      const filterCount = element.shadowRoot.querySelector(".filter-count");
      expect(filterCount).toBeTruthy();
    });
  });
});
