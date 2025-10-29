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

- [CLAUDE.md](./CLAUDE.md) - Detailed architecture, data model, and AI development context
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Lightning Web Components Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)

## Development Phases

See [CLAUDE.md](./CLAUDE.md) for detailed implementation roadmap.

**Current Phase**: Foundation Setup

## Contributing

This project follows Salesforce development best practices:

- Separation of concerns (triggers, handlers, services, selectors)
- Comprehensive test coverage (>75%)
- Code quality tools (ESLint, Prettier)
- Git hooks for pre-commit validation (Husky)

## License

Internal project - All rights reserved
