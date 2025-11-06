# SportsForce

A comprehensive Salesforce solution for managing minor hockey leagues in Canada and the United States.

## Overview

SportsForce is built on the Salesforce Platform with custom Lightning Web Components and provides three main applications:

1. **Backend Admin App** - Internal management for league convenors, webmasters, and schedulers
2. **Public Experience Site** - Unauthenticated portal for public league information, schedules, and rosters
3. **Team Management Portal** - Authenticated portal for coaches, managers, and players to track stats and manage teams

## Key Features

- League, season, and division management
- Team and player roster tracking
- Game scheduling with conflict detection
- Player statistics and leaderboards
- Tryout and registration management
- Tournament tracking
- News and content management system
- Integration with external scheduling and statistics platforms

## Tech Stack

- **Platform**: Salesforce Platform with Experience Cloud
- **Frontend**: Lightning Web Components (LWC)
- **Backend**: Apex, Flow, Process Automation
- **Integrations**: REST APIs for external scheduling systems, statistics platforms, and SMS/email notifications
- **Development**: Salesforce CLI, Git, Jest (testing), ESLint/Prettier (code quality)

## Project Structure

```
sportsforce/
├── force-app/          # Salesforce metadata and source code
├── config/             # Scratch org and environment configurations
├── scripts/            # Apex and SOQL scripts for data management
├── docs/               # Design documents and technical specifications
│   ├── CALENDAR_REFACTOR_DESIGN_PLAN.md        # Calendar refactor vision & design
│   ├── CALENDAR_VISUAL_MOCKUPS.md              # UI mockups & interactions
│   ├── COMPONENT_ARCHITECTURE.md               # Technical architecture specs
│   └── DESIGN_SUMMARY.md                       # Design overview & roadmap
├── .vscode/            # VS Code settings and launch configurations
├── CLAUDE.md          # AI assistant context and architecture documentation
└── sfdx-project.json  # Salesforce DX project configuration
```

## Getting Started

### Prerequisites

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) installed
- [VS Code](https://code.visualstudio.com/) with [Salesforce Extensions](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode)
- [Node.js](https://nodejs.org/) (LTS version)
- Dev Hub enabled in your Salesforce org

### Setup

1. **Authenticate with Dev Hub**

   ```bash
   sf org login web --set-default-dev-hub --alias DevHub
   ```

2. **Create a Scratch Org**

   ```bash
   sf org create scratch --definition-file config/project-scratch-def.json --alias sportsforce-dev --set-default
   ```

3. **Push Source to Scratch Org**

   ```bash
   sf project deploy start
   ```

4. **Open the Scratch Org**

   ```bash
   sf org open
   ```

5. **Install Dependencies** (for LWC development)
   ```bash
   npm install
   ```

### Development Workflow

- **Push changes**: `sf project deploy start`
- **Pull changes**: `sf project retrieve start`
- **Run tests**: `npm test`
- **Lint code**: `npm run lint`
- **Format code**: `npm run prettier`

## Documentation

### Project Context & Architecture

- [CLAUDE.md](./CLAUDE.md) - Detailed architecture, data model, and AI development context
- [README.md](./README.md) - This file; project overview and setup instructions

### Calendar Refactor (Current Initiative)

See `docs/` folder for comprehensive calendar refactor design:

- [CALENDAR_REFACTOR_DESIGN_PLAN.md](./docs/CALENDAR_REFACTOR_DESIGN_PLAN.md) - Project vision, requirements, design system, data flow, and success criteria (50+ pages)
- [CALENDAR_VISUAL_MOCKUPS.md](./docs/CALENDAR_VISUAL_MOCKUPS.md) - ASCII mockups for Month/Week/Day/Gantt views with detailed interactions (40+ pages)
- [COMPONENT_ARCHITECTURE.md](./docs/COMPONENT_ARCHITECTURE.md) - Technical specs for all components, CalendarService (headless), Apex controllers, and optimizations (60+ pages)
- [DESIGN_SUMMARY.md](./docs/DESIGN_SUMMARY.md) - High-level overview, key decisions, implementation roadmap, and checklist (30+ pages)

### External Resources

- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Lightning Web Components Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
- [Lightning Design System](https://www.lightningdesignsystem.com/)

## Development Phases

See [CLAUDE.md](./CLAUDE.md) for detailed implementation roadmap and project phases.

### Current Initiative: Calendar Refactor

**Status**: Design Phase Complete ✅

- Removed FullCalendar dependency
- Designed custom Lightning Web Components with SLDS styling
- Month, Week (primary), Day, and Gantt views specified
- Headless CalendarService architecture designed
- Drag-drop scheduling with conflict detection
- Performance targets and accessibility requirements defined

**Next Step**: Implementation (see [DESIGN_SUMMARY.md](./docs/DESIGN_SUMMARY.md) for roadmap)

**Current Phase**: Calendar Refactor Implementation (Week 1-5)

### Implementation Progress

#### Week 1: Foundation (✅ Complete)

- **CalendarService** (600 lines) - Headless business logic with event filtering, conflict detection, and caching
- **calendarHeader** - Navigation and view selection component
- **Test Suite**: 46+ tests, all passing

#### Week 2: Calendar Views (🔄 In Progress)

- **monthCalendarView** (✅ Complete) - 6-week calendar grid with event display and filtering
  - 38 comprehensive Jest tests (all passing)
  - Event filtering by team, type, arena, division
  - Responsive design with dark mode support
  - Lightning base components throughout
- **weekCalendarView** - Time-grid view with hourly slots
- **dayCalendarView** - Arena-focused daily view
- **filterPanel** (✅ Complete) - Multi-select filtering UI with 32 tests

#### Test Suite Status

- **Total**: 117 tests, all passing ✅
- **Coverage**: calendarService (30), calendarHeader (16), filterPanel (32), monthCalendarView (38)
- **Code Quality**: ESLint clean, Prettier formatted

#### Next Steps

1. Build weekCalendarView (primary view with time grid)
2. Build dayCalendarView (arena columns)
3. Integrate all views with calendarScheduler orchestrator
4. Wire backend data (Phase 2)

## Contributing

This project follows Salesforce development best practices:

- Separation of concerns (triggers, handlers, services, selectors)
- Comprehensive test coverage (>75%)
- Code quality tools (ESLint, Prettier)
- Git hooks for pre-commit validation (Husky)

## License

Internal project - All rights reserved
