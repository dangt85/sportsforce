import { LightningElement, track, wire } from "lwc";
import { getListUi } from "lightning/uiListApi";
import SKATER_STATS_OBJECT from "@salesforce/schema/Player_Season_Stats__c";
import GOALIE_STATS_OBJECT from "@salesforce/schema/Goalie_Season_Stats__c";

export default class StatisticsDashboard extends LightningElement {
  @track isLoading = false;
  @track skaterStats = [];
  @track goalieStats = [];
  @track seasonOptions = [];
  @track divisionOptions = [];
  @track teamOptions = [];
  @track selectedSeason = null;
  @track selectedDivision = null;
  @track selectedTeam = null;
  @track errorMessage = "";
  @track showErrorModal = false;

  skaterColumns = [
    {
      label: "Player",
      fieldName: "playerName",
      type: "text"
    },
    {
      label: "Team",
      fieldName: "teamName",
      type: "text"
    },
    {
      label: "GP",
      fieldName: "Games_Played__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "G",
      fieldName: "Goals__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "A",
      fieldName: "Assists__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "PTS",
      fieldName: "Points__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "PIM",
      fieldName: "Penalty_Minutes__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    }
  ];

  goalieColumns = [
    {
      label: "Player",
      fieldName: "playerName",
      type: "text"
    },
    {
      label: "Team",
      fieldName: "teamName",
      type: "text"
    },
    {
      label: "GP",
      fieldName: "Games_Played__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "W",
      fieldName: "Wins__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "L",
      fieldName: "Losses__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "T",
      fieldName: "Ties__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    },
    {
      label: "GAA",
      fieldName: "Goals_Against_Average__c",
      type: "number",
      typeAttributes: {
        step: "0.01"
      }
    },
    {
      label: "SV%",
      fieldName: "Save_Percentage__c",
      type: "number",
      typeAttributes: {
        step: "0.001"
      }
    },
    {
      label: "Shutouts",
      fieldName: "Shutouts__c",
      type: "number",
      typeAttributes: {
        alignment: "center"
      }
    }
  ];

  connectedCallback() {
    this.loadFilterOptions();
    this.loadStatistics();
  }

  loadFilterOptions() {
    // Load seasons, divisions, and teams for filtering
    // For now, we'll initialize with empty options
    // In a real app, this would call apex methods or wire queries

    this.seasonOptions = [
      { label: "2024-2025 Season", value: "season1" },
      { label: "2023-2024 Season", value: "season2" }
    ];

    this.divisionOptions = [
      { label: "All Divisions", value: "" },
      { label: "Atom AA", value: "atom_aa" },
      { label: "Peewee A", value: "peewee_a" }
    ];

    this.teamOptions = [{ label: "All Teams", value: "" }];
  }

  @wire(getListUi, {
    objectApiName: SKATER_STATS_OBJECT,
    listViewApiName: "AllPlayerSeasonStats"
  })
  wiredSkaterStats({ error, data }) {
    if (data) {
      this.isLoading = false;
      this.processSkaterStats(data);
    } else if (error) {
      console.error("Error loading skater stats", error);
      this.showError("Failed to load skater statistics");
      this.isLoading = false;
    }
  }

  @wire(getListUi, {
    objectApiName: GOALIE_STATS_OBJECT,
    listViewApiName: "AllGoalieSeasonStats"
  })
  wiredGoalieStats({ error, data }) {
    if (data) {
      this.isLoading = false;
      this.processGoalieStats(data);
    } else if (error) {
      console.error("Error loading goalie stats", error);
      this.showError("Failed to load goalie statistics");
      this.isLoading = false;
    }
  }

  processSkaterStats(data) {
    if (data.records && data.records.records) {
      this.skaterStats = data.records.records.map((record) => ({
        id: record.fields.Id.value,
        playerName: record.fields.Contact__c?.displayValue || "",
        teamName: record.fields.Team__c?.displayValue || "",
        Games_Played__c: record.fields.Games_Played__c?.value || 0,
        Goals__c: record.fields.Goals__c?.value || 0,
        Assists__c: record.fields.Assists__c?.value || 0,
        Points__c: record.fields.Points__c?.value || 0,
        Penalty_Minutes__c: record.fields.Penalty_Minutes__c?.value || 0
      }));
    } else {
      this.skaterStats = [];
    }
  }

  processGoalieStats(data) {
    if (data.records && data.records.records) {
      this.goalieStats = data.records.records.map((record) => ({
        id: record.fields.Id.value,
        playerName: record.fields.Contact__c?.displayValue || "",
        teamName: record.fields.Team__c?.displayValue || "",
        Games_Played__c: record.fields.Games_Played__c?.value || 0,
        Wins__c: record.fields.Wins__c?.value || 0,
        Losses__c: record.fields.Losses__c?.value || 0,
        Ties__c: record.fields.Ties__c?.value || 0,
        Goals_Against_Average__c:
          record.fields.Goals_Against_Average__c?.value || 0,
        Save_Percentage__c: record.fields.Save_Percentage__c?.value || 0,
        Shutouts__c: record.fields.Shutouts__c?.value || 0
      }));
    } else {
      this.goalieStats = [];
    }
  }

  get hasSkaterRecords() {
    return this.skaterStats && this.skaterStats.length > 0;
  }

  get hasGoalieRecords() {
    return this.goalieStats && this.goalieStats.length > 0;
  }

  handleSeasonChange(event) {
    this.selectedSeason = event.detail.value;
    this.loadStatistics();
  }

  handleDivisionChange(event) {
    this.selectedDivision = event.detail.value;
    this.loadStatistics();
  }

  handleTeamChange(event) {
    this.selectedTeam = event.detail.value;
    this.loadStatistics();
  }

  loadStatistics() {
    this.isLoading = true;
    // In a real app, this would call Apex with the selected filters
    // Data is loaded via @wire decorators from wiredSkaterStats and wiredGoalieStats
    this.isLoading = false;
  }

  handleCloseErrorModal() {
    this.showErrorModal = false;
  }

  showError(message) {
    this.errorMessage = message;
    this.showErrorModal = true;
  }
}
