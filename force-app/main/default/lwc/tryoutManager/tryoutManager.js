import { LightningElement, track, wire } from "lwc";
import { getListUi } from "lightning/uiListApi";
import TRYOUT_OBJECT from "@salesforce/schema/Tryout__c";

export default class TryoutManager extends LightningElement {
  @track isLoading = false;
  @track tryouts = [];
  @track columns = [
    {
      label: "Name",
      fieldName: "Name",
      type: "text"
    },
    {
      label: "Division",
      fieldName: "Division__r.Name",
      type: "text"
    },
    {
      label: "Date/Time",
      fieldName: "DateTime__c",
      type: "date",
      typeAttributes: {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      }
    },
    {
      label: "Arena",
      fieldName: "Arena__r.Name",
      type: "text"
    },
    {
      label: "Max Participants",
      fieldName: "Max_Participants__c",
      type: "number"
    },
    {
      label: "Status",
      fieldName: "Status__c",
      type: "text"
    },
    {
      type: "action",
      typeAttributes: {
        rowActions: [
          { label: "View", name: "view" },
          { label: "Edit", name: "edit" },
          { label: "Delete", name: "delete" }
        ]
      }
    }
  ];
  @track selectedRecord = null;
  @track showRecordModal = false;
  @track showErrorModal = false;
  @track errorMessage = "";
  @track searchTerm = "";
  @track modalTitle = "Tryout Details";

  // Wire getListUi to load tryouts
  @wire(getListUi, {
    objectApiName: TRYOUT_OBJECT,
    listViewApiName: "AllTryouts",
    pageSize: 50
  })
  wiredTryouts({ error, data }) {
    if (data) {
      this.isLoading = false;
      this.processTryoutData(data);
    } else if (error) {
      console.error("Error loading tryouts", error);
      this.showError("Failed to load tryouts");
      this.isLoading = false;
    }
  }

  processTryoutData(data) {
    if (data.records && data.records.records) {
      this.tryouts = data.records.records.map((record) => ({
        id: record.fields.Id.value,
        Name: record.fields.Name.value,
        "Division__r.Name": record.fields.Division__c?.displayValue || "",
        DateTime__c: record.fields.DateTime__c?.value || "",
        "Arena__r.Name": record.fields.Arena__c?.displayValue || "",
        Max_Participants__c: record.fields.Max_Participants__c?.value || "",
        Status__c: record.fields.Status__c?.value || ""
      }));
    } else {
      this.tryouts = [];
    }
  }

  get hasRecords() {
    return this.tryouts && this.tryouts.length > 0;
  }

  get isLoaded() {
    return !this.isLoading;
  }

  get noRecords() {
    return !this.hasRecords;
  }

  handleNewTryoutClick() {
    // Navigate to create new tryout record
    window.open("/lightning/o/Tryout__c/new", "_blank");
  }

  handleSearchChange(event) {
    this.searchTerm = event.target.value.toLowerCase();
    // In a real app, we'd filter the tryouts array
    // or make a server call with the search term
  }

  handleRowAction(event) {
    const row = event.detail.row;
    const action = event.detail.action.name;

    switch (action) {
      case "view":
        this.handleViewTryout(row);
        break;
      case "edit":
        this.handleEditTryout(row);
        break;
      case "delete":
        this.handleDeleteTryout(row);
        break;
      default:
        break;
    }
  }

  handleViewTryout(row) {
    this.selectedRecord = row;
    this.showRecordModal = true;
  }

  handleEditTryout(row) {
    window.open(`/lightning/r/Tryout__c/${row.id}/edit`, "_blank");
  }

  handleDeleteTryout() {
    // Delete functionality coming soon
    // TODO: Implement delete with API call
    this.showError("Delete functionality coming soon");
  }

  handleCloseModal() {
    this.showRecordModal = false;
    this.selectedRecord = null;
  }

  handleViewRecord() {
    if (this.selectedRecord) {
      window.open(
        `/lightning/r/Tryout__c/${this.selectedRecord.id}/view`,
        "_blank"
      );
    }
  }

  handleEditRecord() {
    if (this.selectedRecord) {
      window.open(
        `/lightning/r/Tryout__c/${this.selectedRecord.id}/edit`,
        "_blank"
      );
    }
  }

  handleCloseErrorModal() {
    this.showErrorModal = false;
  }

  showError(message) {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  get formattedDateTime() {
    if (!this.selectedRecord || !this.selectedRecord.DateTime__c) {
      return "";
    }

    const date = new Date(this.selectedRecord.DateTime__c);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}
