import { LightningElement, api } from "lwc";

/**
 * filterPanel
 *
 * Multi-select filter component for calendar events
 * Provides filtering by teams, event types, arenas, and divisions
 *
 * Outputs:
 * filterchange - Fires when filters are updated with detail containing:
 *   { teams: [], eventTypes: [], arenas: [], divisions: [] }
 */

export default class FilterPanel extends LightningElement {
  // ===== API PROPERTIES (INPUTS) =====

  /**
   * Available teams for filtering
   * Array of { id: string, name: string }
   */
  @api teams = [];

  /**
   * Available event types for filtering
   * Array of { id: string, label: string }
   */
  @api eventTypes = [];

  /**
   * Available arenas for filtering
   * Array of { id: string, name: string }
   */
  @api arenas = [];

  /**
   * Available divisions for filtering
   * Array of { id: string, name: string }
   */
  @api divisions = [];

  // ===== INTERNAL STATE =====

  /**
   * Currently selected team IDs
   */
  selectedTeams = [];

  /**
   * Currently selected event type IDs
   */
  selectedEventTypes = [];

  /**
   * Currently selected arena IDs
   */
  selectedArenas = [];

  /**
   * Currently selected division IDs
   */
  selectedDivisions = [];

  // ===== LIFECYCLE =====

  connectedCallback() {
    // Initialize empty filters
    this.selectedTeams = [];
    this.selectedEventTypes = [];
    this.selectedArenas = [];
    this.selectedDivisions = [];
  }

  // ===== COMPUTED PROPERTIES =====

  /**
   * Get count of active filters
   */
  get activeFilterCount() {
    return (
      this.selectedTeams.length +
      this.selectedEventTypes.length +
      this.selectedArenas.length +
      this.selectedDivisions.length
    );
  }

  /**
   * Check if clear button should be enabled
   */
  get isClearButtonDisabled() {
    return this.activeFilterCount === 0;
  }

  /**
   * Get filter count text
   */
  get filterCountText() {
    const count = this.activeFilterCount;
    return count === 1 ? "1 active filter" : `${count} active filters`;
  }

  /**
   * Get team options for combobox
   */
  get teamOptions() {
    return this.teams.map((team) => ({
      label: team.name,
      value: team.id
    }));
  }

  /**
   * Get event type options for combobox
   */
  get eventTypeOptions() {
    return this.eventTypes.map((type) => ({
      label: type.label,
      value: type.id
    }));
  }

  /**
   * Get arena options for combobox
   */
  get arenaOptions() {
    return this.arenas.map((arena) => ({
      label: arena.name,
      value: arena.id
    }));
  }

  /**
   * Get division options for combobox
   */
  get divisionOptions() {
    return this.divisions.map((div) => ({
      label: div.name,
      value: div.id
    }));
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle team selection change
   */
  handleTeamChange(event) {
    this.selectedTeams = event.detail.value || [];
    this._emitFilterChange();
  }

  /**
   * Handle event type selection change
   */
  handleEventTypeChange(event) {
    this.selectedEventTypes = event.detail.value || [];
    this._emitFilterChange();
  }

  /**
   * Handle arena selection change
   */
  handleArenaChange(event) {
    this.selectedArenas = event.detail.value || [];
    this._emitFilterChange();
  }

  /**
   * Handle division selection change
   */
  handleDivisionChange(event) {
    this.selectedDivisions = event.detail.value || [];
    this._emitFilterChange();
  }

  /**
   * Handle clear filters button click
   */
  handleClearFilters() {
    this.clearFilters();
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Get current filter selections
   * @returns {Object} Current filters { teams, eventTypes, arenas, divisions }
   */
  getFilters() {
    return {
      teams: [...this.selectedTeams],
      eventTypes: [...this.selectedEventTypes],
      arenas: [...this.selectedArenas],
      divisions: [...this.selectedDivisions]
    };
  }

  /**
   * Set filter selections programmatically
   * @param {Object} filters - Filters to set { teams, eventTypes, arenas, divisions }
   */
  setFilters(filters) {
    if (filters.teams) {
      this.selectedTeams = Array.isArray(filters.teams)
        ? [...filters.teams]
        : [];
    }
    if (filters.eventTypes) {
      this.selectedEventTypes = Array.isArray(filters.eventTypes)
        ? [...filters.eventTypes]
        : [];
    }
    if (filters.arenas) {
      this.selectedArenas = Array.isArray(filters.arenas)
        ? [...filters.arenas]
        : [];
    }
    if (filters.divisions) {
      this.selectedDivisions = Array.isArray(filters.divisions)
        ? [...filters.divisions]
        : [];
    }
    this._emitFilterChange();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.selectedTeams = [];
    this.selectedEventTypes = [];
    this.selectedArenas = [];
    this.selectedDivisions = [];
    this._emitFilterChange();
  }

  /**
   * Check if any filters are active
   * @returns {Boolean} True if any filter is selected
   */
  hasFilters() {
    return this.activeFilterCount > 0;
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Emit filterchange event with current filter state
   * @private
   */
  _emitFilterChange() {
    this.dispatchEvent(
      new CustomEvent("filterchange", {
        detail: {
          teams: [...this.selectedTeams],
          eventTypes: [...this.selectedEventTypes],
          arenas: [...this.selectedArenas],
          divisions: [...this.selectedDivisions]
        },
        bubbles: true,
        composed: true
      })
    );
  }
}
