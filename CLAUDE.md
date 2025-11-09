# CLAUDE.md - AI Development Context

**SportsForce** is a Salesforce-based solution for managing minor hockey leagues through three integrated applications: Backend Admin App (internal staff), Public Experience Site (anonymous), and Team Management Portal (authenticated users).

## Project Overview

**Platform**: Salesforce + Experience Cloud + LWC + Apex + Flow
**Scale**: Regional leagues with 1,000s of users
**Key Objectives**: Centralize league operations, public information portal, team management, external integrations

## Current Focus: Calendar Refactor Initiative

**Status**: Design Complete ✅ | Gantt View Implemented ✅ | Week View In Progress 🚀

Replacing FullCalendar library with custom LWC components (4 views: Month, Week, Day, Gantt) using SLDS styling.

### Design Documentation (150+ pages)

- [CALENDAR_REFACTOR_DESIGN_PLAN.md](./docs/CALENDAR_REFACTOR_DESIGN_PLAN.md) - Master design, requirements, architecture
- [CALENDAR_VISUAL_MOCKUPS.md](./docs/CALENDAR_VISUAL_MOCKUPS.md) - UI mockups for all views
- [COMPONENT_ARCHITECTURE.md](./docs/COMPONENT_ARCHITECTURE.md) - Technical specs, CalendarService, Apex controllers
- [DESIGN_SUMMARY.md](./docs/DESIGN_SUMMARY.md) - Executive summary
- [GANTT_IMPLEMENTATION_SUMMARY.md](./docs/GANTT_IMPLEMENTATION_SUMMARY.md) - Gantt view status

### Implementation Status

| Week | Focus               | Status            |
| ---- | ------------------- | ----------------- |
| 1    | Foundation          | ✅ Complete       |
| 2    | Week View (Primary) | 🚀 In Progress    |
| 3    | Other Views         | ✅ Gantt Complete |
| 4    | Optimization        | ⏳ Pending        |
| 5    | Testing & Deploy    | ⏳ Pending        |

---

## Development Patterns

**Architecture**: Trigger Handler → Service → Selector (business logic separation)
**Naming**: `ObjectName__c`, `Field_Name__c`, `PascalCase` (classes), `camelCase` (methods/LWCs)
**File Structure**: classes/{services,handlers,selectors,controllers,tests}, lwc/, triggers/, flows/, objects/
**Testing**: 75% min coverage, 85%+ target, TDD approach with TestDataFactory
**LWC**: Composition over inheritance, lightning base components, `@wire` for cacheable data, GraphQL preferred

## Questions or Clarifications Needed

- Payment gateway preference (Stripe, PayPal, native Salesforce?)
- Document upload requirements for registration (medical forms, waivers)
- Referee/official management scope
- Video highlight integration requirements
- Historical data migration volume and format

---

**Last Updated**: 2025-11-07
**Version**: 1.2 (Gantt Arena View Implementation Complete)
**Maintained By**: Development Team

**Version History**:

- v1.2 (2025-11-07): Gantt Arena View implementation complete - UI alignment fixes, mock data, Week/Month zoom levels, full test coverage
- v1.1 (2025-11-05): Added Calendar Refactor Initiative section with comprehensive design documentation
- v1.0 (2025-10-29): Initial project context and architecture documentation

**Generic coding guidelines**

- when implementing LWCs, always use the sfdx MCP server tools like guide_lwc_development, orchestrate_lwc_component_creation, create_lwc_component_from_prd, guide_lwc_accessibility
- when implementing LWCs, always try to use lightning base components for things like buttons, cards, layouts, inputs, etc. instead of custom HTML
- when starting a new LWC, always start with the jest tests. Try to do TDD as much as possible and use sf lightning dev (local development)
- when wiring LWC to data, always prefer using GraphQL wires if possible. If not possible, then default to Apex
- use the latest API version available in the org (curently 65.0) when creating new metadata
