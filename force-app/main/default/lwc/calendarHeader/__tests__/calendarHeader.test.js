import { createElement } from "lwc";
import CalendarHeader from "../calendarHeader";

describe("calendarHeader", () => {
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
    element = createElement("c-calendar-header", { is: CalendarHeader });
    document.body.appendChild(element);
  });

  describe("Component Initialization", () => {
    test("should render without errors", () => {
      expect(element).toBeTruthy();
    });

    test("should display current month and year in month view", async () => {
      const today = new Date();
      const expectedMonth = today.toLocaleString("default", { month: "long" });
      const expectedYear = today.getFullYear().toString();

      element.currentDate = today;
      element.currentView = "month";
      await flushPromises();

      const header = element.shadowRoot.querySelector(".calendar-header-title");
      expect(header.textContent).toContain(expectedMonth);
      expect(header.textContent).toContain(expectedYear);
    });

    test("should have default view set to week", async () => {
      await flushPromises();
      expect(element.currentView).toBe("week");
    });
  });

  describe("Week Label Display", () => {
    test("should display week range in week view", async () => {
      // Nov 6, 2025 is a Thursday (Mon Nov 3 - Sun Nov 9)
      element.currentDate = new Date("2025-11-06");
      element.currentView = "week";
      await flushPromises();

      const header = element.shadowRoot.querySelector(".calendar-header-title");
      expect(header.textContent).toContain("Nov 3");
      expect(header.textContent).toContain("Nov 9");
      expect(header.textContent).toContain("2025");
    });

    test("should display week range spanning two months", async () => {
      // Oct 30, 2025 is a Thursday (Mon Oct 27 - Sun Nov 2)
      element.currentDate = new Date("2025-10-30");
      element.currentView = "week";
      await flushPromises();

      const header = element.shadowRoot.querySelector(".calendar-header-title");
      expect(header.textContent).toContain("Oct 27");
      expect(header.textContent).toContain("Nov 2");
      expect(header.textContent).toContain("2025");
    });

    test("should display month/year in non-week views", async () => {
      element.currentDate = new Date("2025-11-06");
      element.currentView = "month";
      await flushPromises();

      const header = element.shadowRoot.querySelector(".calendar-header-title");
      expect(header.textContent).toContain("November 2025");
      expect(header.textContent).not.toContain("Nov 3");
    });

    test("should update week label when navigating weeks", async () => {
      element.currentDate = new Date("2025-11-06"); // Nov 3-9
      element.currentView = "week";
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("datechange", handler);

      const nextButton = element.shadowRoot.querySelector(
        '[data-action="next"]'
      );
      nextButton.click();

      await flushPromises();

      // After clicking next, date should change to next week
      const newDate = handler.mock.calls[0][0].detail;
      element.currentDate = newDate;
      await flushPromises();

      const header = element.shadowRoot.querySelector(".calendar-header-title");
      // Should be next week (Nov 10-16)
      expect(header.textContent).toContain("Nov 10");
      expect(header.textContent).toContain("Nov 16");
    });

    test("should display week range in Gantt view with week zoom level", async () => {
      element.currentDate = new Date("2025-11-06");
      element.currentView = "gantt";
      element.zoomLevel = "week";
      await flushPromises();

      const header = element.shadowRoot.querySelector(".calendar-header-title");
      expect(header.textContent).toContain("Nov 3");
      expect(header.textContent).toContain("Nov 9");
      expect(header.textContent).toContain("2025");
    });

    test("should display month/year in Gantt view with month zoom level", async () => {
      element.currentDate = new Date("2025-11-06");
      element.currentView = "gantt";
      element.zoomLevel = "month";
      await flushPromises();

      const header = element.shadowRoot.querySelector(".calendar-header-title");
      expect(header.textContent).toContain("November 2025");
      expect(header.textContent).not.toContain("Nov 3");
    });
  });

  describe("View Selection", () => {
    test("should emit viewchange event when month button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("viewchange", handler);

      const monthButton = element.shadowRoot.querySelector(
        '[data-view="month"]'
      );
      monthButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: "month"
        })
      );
    });

    test("should emit viewchange event when week button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      element.currentView = "month";
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("viewchange", handler);

      const weekButton = element.shadowRoot.querySelector('[data-view="week"]');
      weekButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: "week"
        })
      );
    });

    test("should emit viewchange event when day button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("viewchange", handler);

      const dayButton = element.shadowRoot.querySelector('[data-view="day"]');
      dayButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: "day"
        })
      );
    });

    test("should emit viewchange event when gantt button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("viewchange", handler);

      const ganttButton = element.shadowRoot.querySelector(
        '[data-view="gantt"]'
      );
      ganttButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: "gantt"
        })
      );
    });

    test("should set active view button variant to brand", async () => {
      element.currentView = "week";
      await flushPromises();

      const weekButton = element.shadowRoot.querySelector('[data-view="week"]');
      expect(weekButton.variant).toBe("brand");
    });
  });

  describe("Navigation", () => {
    test("should emit datechange event when prev button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("datechange", handler);

      const prevButton = element.shadowRoot.querySelector(
        '[data-action="prev"]'
      );
      prevButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalled();
      const newDate = handler.mock.calls[0][0].detail;
      expect(newDate.getTime()).toBeLessThan(new Date("2025-11-06").getTime());
    });

    test("should emit datechange event when next button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("datechange", handler);

      const nextButton = element.shadowRoot.querySelector(
        '[data-action="next"]'
      );
      nextButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalled();
      const newDate = handler.mock.calls[0][0].detail;
      expect(newDate.getTime()).toBeGreaterThan(
        new Date("2025-11-06").getTime()
      );
    });

    test("should emit datechange event when today button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("datechange", handler);

      const todayButton = element.shadowRoot.querySelector(
        '[data-action="today"]'
      );
      todayButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalled();
      const newDate = handler.mock.calls[0][0].detail;
      const today = new Date();
      expect(newDate.toDateString()).toBe(today.toDateString());
    });

    test("should navigate week for week view", async () => {
      element.currentDate = new Date("2025-11-06"); // Thursday
      element.currentView = "week";
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("datechange", handler);

      const prevButton = element.shadowRoot.querySelector(
        '[data-action="prev"]'
      );
      prevButton.click();

      await flushPromises();

      const newDate = handler.mock.calls[0][0].detail;
      // Should go back one week (7 days)
      expect(
        Math.abs(newDate.getTime() - new Date("2025-10-30").getTime())
      ).toBeLessThan(
        24 * 60 * 60 * 1000 // Within 1 day
      );
    });

    test("should navigate month for month view", async () => {
      element.currentDate = new Date("2025-11-06");
      element.currentView = "month";
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("datechange", handler);

      const prevButton = element.shadowRoot.querySelector(
        '[data-action="prev"]'
      );
      prevButton.click();

      await flushPromises();

      const newDate = handler.mock.calls[0][0].detail;
      // Should go back one month (to October)
      expect(newDate.getMonth()).toBe(9); // October
      expect(newDate.getFullYear()).toBe(2025);
    });
  });

  describe("Date Picker", () => {
    test("should have date picker input", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const datePicker = element.shadowRoot.querySelector("lightning-input");
      expect(datePicker).toBeTruthy();
      expect(datePicker.type).toBe("date");
    });
  });

  describe("Settings Button", () => {
    test("should emit settingsclick event when settings button clicked", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("settingsclick", handler);

      const settingsButton = element.shadowRoot.querySelector(
        '[data-action="settings"]'
      );
      settingsButton.click();

      await flushPromises();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Responsive Behavior", () => {
    test("should have proper SLDS structure", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const header = element.shadowRoot.querySelector(".slds-page-header");
      expect(header).toBeTruthy();
    });

    test("should render lightning-button components", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
