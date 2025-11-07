import { LightningElement, api } from "lwc";

/**
 * ganttArenaView
 *
 * Arena utilization Gantt chart showing availability across timeline
 *
 * Features:
 * - Rows for each arena (sticky left)
 * - Timeline blocks for time slots
 * - Zoom levels (week, month, quarter)
 * - Utilization % per arena
 * - Event type indicators (G/P/T)
 * - Hover tooltips with event details
 * - Filtering by division, team, event type
 *
 * Input Props:
 * @api currentDate - Date to center timeline on
 * @api events - Array of calendar events
 * @api selectedFilters - Filter state {teams, eventTypes, arenas, divisions}
 * @api zoomLevel - 'week' or 'month'
 *
 * Output Events:
 * @fires eventclick - When an event block is clicked
 */

export default class GanttArenaView extends LightningElement {
  // ===== API PROPERTIES =====

  @api currentDate = new Date();

  @api
  get events() {
    return this._events;
  }

  set events(value) {
    this._events = value || [];
    this.updateGanttData();
  }

  _events = [];

  _selectedFilters = {
    teams: [],
    eventTypes: [],
    arenas: [],
    divisions: []
  };

  @api
  get selectedFilters() {
    return this._selectedFilters;
  }

  set selectedFilters(value) {
    if (value) {
      this._selectedFilters = {
        teams: value.teams || [],
        eventTypes: value.eventTypes || [],
        arenas: value.arenas || [],
        divisions: value.divisions || []
      };
      this.updateGanttData();
    }
  }

  _zoomLevel = "week";

  @api
  get zoomLevel() {
    return this._zoomLevel;
  }

  set zoomLevel(value) {
    if (value) {
      this._zoomLevel = value;
      this.updateGanttData();
    }
  }

  // ===== CONSTANTS =====

  static ZOOM_LEVELS = {
    week: { label: "Week", days: 7, blockType: "day" },
    month: { label: "Month", days: 30, blockType: "day" }
  };

  // ===== INTERNAL STATE =====

  arenaRows = [];
  timelineBlocks = [];
  timelineLabels = [];
  visibleArenas = [];

  // ===== COMPUTED PROPERTIES =====

  get ganttTitle() {
    const season = this.currentDate.getFullYear();
    return `Arena Utilization - Season ${season}-${season + 1}`;
  }

  get isWeekZoom() {
    return this.zoomLevel === "week";
  }

  get isMonthZoom() {
    return this.zoomLevel === "month";
  }

  get weekZoomVariant() {
    return this.isWeekZoom ? "brand" : "neutral";
  }

  get monthZoomVariant() {
    return this.isMonthZoom ? "brand" : "neutral";
  }

  // ===== LIFECYCLE HOOKS =====

  connectedCallback() {
    this.updateGanttData();
  }

  renderedCallback() {
    // Apply utilization bar widths
    const bars = this.template.querySelectorAll(".gantt-utilization-fill");
    bars.forEach((bar) => {
      const width = bar.dataset.width;
      if (width) {
        bar.style.width = `${width}%`;
      }
    });
  }

  // ===== PRIVATE METHODS =====

  setZoomLevel(level) {
    if (level && level !== this._zoomLevel) {
      this._zoomLevel = level;
      this.updateGanttData();
    }
  }

  // ===== ZOOM HANDLERS =====

  handleWeekZoom() {
    this.setZoomLevel("week");
  }

  handleMonthZoom() {
    this.setZoomLevel("month");
  }

  // ===== DATA METHODS =====

  updateGanttData() {
    // Get unique arenas from events
    const arenasSet = new Set();
    this._events.forEach((event) => {
      if (event.location) {
        arenasSet.add(event.location);
      }
    });

    const arenas = Array.from(arenasSet).sort();

    // Generate timeline based on zoom level
    const zoomConfig =
      GanttArenaView.ZOOM_LEVELS[this.zoomLevel] ||
      GanttArenaView.ZOOM_LEVELS.month;
    this.generateTimeline(zoomConfig);

    // Build arena rows with blocks
    this.arenaRows = arenas.map((arena, index) => {
      const eventsForArena = this._events.filter((e) => e.location === arena);
      const blocks = this.generateBlocksForArena(arena, eventsForArena);
      const utilization = this.calculateUtilization(blocks);

      return {
        id: `arena-${index}`,
        name: arena,
        index,
        utilization,
        blocks
      };
    });
  }

  generateTimeline(zoomConfig) {
    const blocks = [];
    const labels = [];
    const startDate = new Date(this.currentDate);
    startDate.setDate(startDate.getDate() - Math.floor(zoomConfig.days / 2));

    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    });

    for (let i = 0; i < zoomConfig.days; i++) {
      const blockDate = new Date(startDate);
      blockDate.setDate(blockDate.getDate() + i);

      blocks.push({
        date: blockDate,
        label: formatter.format(blockDate)
      });

      // Add period labels for month/quarter views
      if (zoomConfig.blockType === "week" && i % 4 === 0) {
        labels.push({
          date: blockDate,
          period: `${blockDate.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit"
          })}`
        });
      }
    }

    this.timelineBlocks = blocks;
    this.timelineLabels = labels;
  }

  generateBlocksForArena(arena, events) {
    return this.timelineBlocks.map((timeBlock) => {
      const eventsOnDate = events.filter((event) => {
        const eventDate = new Date(event.startTime);
        return (
          eventDate.getFullYear() === timeBlock.date.getFullYear() &&
          eventDate.getMonth() === timeBlock.date.getMonth() &&
          eventDate.getDate() === timeBlock.date.getDate()
        );
      });

      const eventTypes = eventsOnDate.map((e) => {
        switch (e.type) {
          case "Game":
            return "G";
          case "Practice":
            return "P";
          case "Tryout":
            return "T";
          default:
            return "E";
        }
      });

      const isBooked = eventsOnDate.length > 0;
      let blockClass = "gantt-block";

      if (!isBooked) {
        blockClass += " gantt-block--empty";
      } else {
        const types = eventTypes.join("");
        if (types.includes("G")) {
          blockClass += " gantt-block--game";
        } else if (types.includes("P")) {
          blockClass += " gantt-block--practice";
        } else if (types.includes("T")) {
          blockClass += " gantt-block--tryout";
        } else {
          blockClass += " gantt-block--event";
        }
      }

      return {
        date: timeBlock.date,
        isBooked,
        eventTypes: eventTypes.slice(0, 2).join(""), // Show max 2 event type letters
        events: eventsOnDate,
        label: timeBlock.label,
        cssClass: blockClass
      };
    });
  }

  calculateUtilization(blocks) {
    const bookedCount = blocks.filter((b) => b.isBooked).length;
    const percentage = Math.round((bookedCount / blocks.length) * 100);
    return {
      percentage,
      bookedCount,
      totalCount: blocks.length
    };
  }

  // ===== EVENT HANDLERS =====

  handleBlockClick(event) {
    const blockIndex = parseInt(event.currentTarget.dataset.blockIndex, 10);
    const arenaIndex = parseInt(event.currentTarget.dataset.arenaIndex, 10);

    const arena = this.arenaRows[arenaIndex];
    const block = arena.blocks[blockIndex];

    if (block.events.length > 0) {
      // Fire event for each event in the block
      block.events.forEach((eventData) => {
        this.dispatchEvent(
          new CustomEvent("eventclick", {
            detail: eventData
          })
        );
      });
    }
  }

  handleBlockHover(event) {
    const blockIndex = parseInt(event.currentTarget.dataset.blockIndex, 10);
    const arenaIndex = parseInt(event.currentTarget.dataset.arenaIndex, 10);

    const arena = this.arenaRows[arenaIndex];
    const block = arena.blocks[blockIndex];

    if (block.events.length > 0) {
      const tooltipText = block.events
        .map(
          (e) =>
            `${e.title} (${new Date(e.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit"
            })})`
        )
        .join("\n");

      event.currentTarget.title = tooltipText;
    }
  }
}
