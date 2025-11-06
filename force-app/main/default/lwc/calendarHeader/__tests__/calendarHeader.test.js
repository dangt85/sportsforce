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

    test("should display current month and year", async () => {
      const today = new Date();
      const expectedMonth = today.toLocaleString("default", { month: "long" });
      const expectedYear = today.getFullYear().toString();

      element.currentDate = today;
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

    test("should highlight active view button", async () => {
      element.currentView = "week";
      await flushPromises();

      const weekButton = element.shadowRoot.querySelector('[data-view="week"]');
      expect(weekButton.classList.contains("slds-button--brand")).toBe(true);
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
    test("should emit datechange event when date selected in picker", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const handler = jest.fn();
      element.addEventListener("datechange", handler);

      const datePicker = element.shadowRoot.querySelector('input[type="date"]');
      datePicker.value = "2025-11-15";

      const event = new CustomEvent("change", { bubbles: true });
      datePicker.dispatchEvent(event);

      await flushPromises();

      expect(handler).toHaveBeenCalled();
      const selectedDate = handler.mock.calls[0][0].detail;
      expect(selectedDate.getDate()).toBe(15);
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

    test("should use SLDS button classes", async () => {
      element.currentDate = new Date("2025-11-06");
      await flushPromises();

      const buttons = element.shadowRoot.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((btn) => {
        expect(btn.classList.contains("slds-button")).toBe(true);
      });
    });
  });
});
