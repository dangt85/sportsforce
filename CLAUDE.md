# CLAUDE.md - AI Development Context

This document provides comprehensive context for AI assistants (like Claude Code) working on the SportsForce project.

## Project Overview

**SportsForce** is a Salesforce-based solution for managing minor hockey leagues in Canada and the United States. It serves league administrators, coaches, players, and families through three integrated applications.

### Target Users

- **Internal Staff**: League convenors, webmasters, schedulers, division coordinators
- **Public Users**: Parents, fans, prospective players (anonymous access)
- **Authenticated Users**: Team managers, coaches, players, representatives

### Key Objectives

1. Centralize league operations and data management
2. Provide public-facing information portal for schedules, rosters, and news
3. Enable team staff to manage rosters and track statistics
4. Integrate with external scheduling and statistics platforms
5. Support regional scale (1,000s of users across multiple leagues)

## Architecture

### Platform Stack

- **Salesforce Platform** - Core application foundation
- **Experience Cloud** - Public site (#2) and authenticated portal (#3)
- **Lightning Web Components (LWC)** - Custom UI components
- **Apex** - Server-side business logic
- **Flow & Process Automation** - Declarative automation
- **REST APIs** - External integrations

### Three Application Architecture

#### 1. Backend Admin App (Internal)

**Platform**: Custom Lightning App in core Salesforce
**Users**: League convenors, webmasters, schedulers

**Key Components**:

- Custom Lightning App with tab-based navigation
- Custom LWC components:
  - Schedule Builder (drag-and-drop calendar)
  - Tryout Evaluator (mobile scoring interface)
  - Statistics Calculator (real-time aggregation)
  - Content Editor (WYSIWYG for news/pages)
- Reports & Dashboards
- Flow-based automation

#### 2. Public Experience Site (Anonymous)

**Platform**: Experience Cloud (Unauthenticated)
**Users**: General public, prospective families

**Key Pages**:

- Home (league info, featured news)
- Schedules (filterable calendar)
- Standings (live division rankings)
- Teams (rosters, read-only)
- Statistics Leaders
- News & Announcements
- Arenas (venue info)
- Registration (public form)

**Technical Considerations**:

- Aggressive caching (@AuraEnabled cacheable=true)
- CDN optimization
- SEO-friendly URLs
- Mobile-responsive LWCs

#### 3. Team Management Portal (Authenticated)

**Platform**: Experience Cloud (Authenticated)
**Users**: Team managers, coaches, players/representatives

**Key Features**:

- Personalized dashboard ("My Teams")
- Roster management (managers/coaches)
- Game roster submission
- Statistics tracking (individual & team)
- Tournament tracker
- Team communications

**Security Model**:

- Team-based record sharing via Apex
- Custom profiles per user type
- Field-level security for sensitive data

## Calendar Refactor Initiative

**Status**: Design Complete | Implementation Starting

This project is undergoing a significant refactoring of the calendar/scheduling functionality. The existing FullCalendar library is being replaced with custom Lightning Web Components using Lightning Design System (SLDS) styling and custom HTML.

### What's New

- **Removed**: FullCalendar external dependency
- **Added**: Custom LWC components with 4 views (Month, Week, Day, Gantt)
- **Added**: Headless CalendarService (business logic layer)
- **Added**: Drag-drop event rescheduling with conflict detection
- **Architecture**: Event-driven with service-layer filtering

### Key Design Decisions

| Decision             | Approach                                  | Rationale                               |
| -------------------- | ----------------------------------------- | --------------------------------------- |
| **Views**            | Month, Week (primary), Day, Gantt         | All 4 views specified and designed      |
| **Time Granularity** | 15-min default, configurable to 30/60 min | Precision + flexibility                 |
| **Conflicts**        | Server-side validation with UI warnings   | Prevent data corruption, allow override |
| **Caching**          | 3 weeks in memory + 5min TTL              | Balance UX speed with data freshness    |
| **Responsive**       | Desktop-focused (1024px+), mobile hidden  | Simplifies implementation               |
| **Interactions**     | Drag-drop + Click-to-create               | Familiar calendar UX patterns           |

### Design Documentation

**150+ pages of comprehensive specifications**:

1. [docs/CALENDAR_REFACTOR_DESIGN_PLAN.md](./docs/CALENDAR_REFACTOR_DESIGN_PLAN.md)
   - Project vision, requirements, design system, data flow
   - View specifications (Month, Week, Day, Gantt)
   - Integration architecture, settings, success criteria

2. [docs/CALENDAR_VISUAL_MOCKUPS.md](./docs/CALENDAR_VISUAL_MOCKUPS.md)
   - ASCII mockups for all 4 views
   - Component state variations (normal, hover, dragging, conflict)
   - Color palette and responsive behavior

3. [docs/COMPONENT_ARCHITECTURE.md](./docs/COMPONENT_ARCHITECTURE.md)
   - Component tree and specifications
   - CalendarService (headless logic) detailed design
   - Apex controller specifications with method signatures
   - Data models & interfaces (TypeScript)
   - Performance optimizations

4. [docs/DESIGN_SUMMARY.md](./docs/DESIGN_SUMMARY.md)
   - Executive overview and key design decisions
   - Performance targets and accessibility approach
   - Rollout plan and implementation roadmap

### Implementation Roadmap

| Week | Focus               | Components                                             |
| ---- | ------------------- | ------------------------------------------------------ |
| 1    | Foundation          | CalendarService, Apex controllers, basic structure     |
| 2    | Week View (Primary) | Time grid, drag-drop, quick-create, event detail panel |
| 3    | Other Views         | Month, Day, Gantt views                                |
| 4    | Optimization        | Virtual scrolling, caching, accessibility              |
| 5    | Testing & Deploy    | Tests, UAT, production deployment                      |

---

## Data Model

### Core Custom Objects

#### League Structure

```
League__c (Master)
  └─ Season__c (Master-Detail)
      └─ Division__c (Master-Detail)
          └─ Team__c (Lookup)
```

**League\_\_c**

- Purpose: Top-level organization (e.g., "Ontario Minor Hockey Association")
- Key Fields: Name, Region, Province/State, Logo, Contact_Info\_\_c

**Season\_\_c**

- Purpose: Time-bound competition period
- Key Fields: Start_Date\_\_c, End_Date\_\_c, Registration_Deadline\_\_c, Status\_\_c (Active/Completed/Upcoming)
- Master-Detail: League\_\_c

**Division\_\_c**

- Purpose: Age/skill groupings (e.g., "Atom AA", "Peewee A")
- Key Fields: Name, Min_Age\_\_c, Max_Age\_\_c, Skill_Level\_\_c
- Master-Detail: Season\_\_c

**Team\_\_c**

- Purpose: Individual teams
- Key Fields: Name, Team_Colors\_\_c, Logo\_\_c, Home_Arena\_\_c (Lookup to Arena\_\_c)
- Lookup: Division\_\_c

#### People Management

**Contact (Standard Object Extended)**

- Purpose: Players, coaches, parents, officials
- Custom Fields:
  - Date_of_Birth\_\_c
  - Player_ID\_\_c (unique)
  - Hockey_Registration_Number\_\_c (Hockey Canada / USA Hockey)
  - Emergency_Contact_Name\_\_c
  - Emergency_Contact_Phone\_\_c
  - Medical_Notes\_\_c (encrypted)
  - Position\_\_c (Forward/Defense/Goalie)

**Account (Standard Object Extended)**

- Purpose: Family/household accounts
- Model: One Account per family, multiple Contacts as household members

**Team_Member\_\_c**

- Purpose: Junction object for team assignments
- Key Fields:
  - Team\_\_c (Lookup)
  - Contact\_\_c (Lookup - player or staff)
  - Role\_\_c (Player/Coach/Manager/Trainer/Assistant Coach)
  - Jersey_Number\_\_c
  - Position\_\_c
  - Status\_\_c (Active/Inactive/Injured Reserve)
- Unique Constraint: Contact + Team + Season (via validation rule)

#### Schedule & Games

**Arena\_\_c**

- Purpose: Rink/venue information
- Key Fields: Name, Address\_\_c, City\_\_c, Province_State\_\_c, Ice_Surface_Count\_\_c, Capacity\_\_c, Contact_Email\_\_c

**Game\_\_c**

- Purpose: Individual game records
- Key Fields:
  - Home_Team\_\_c (Lookup to Team\_\_c)
  - Away_Team\_\_c (Lookup to Team\_\_c)
  - Arena\_\_c (Lookup)
  - Game_DateTime\_\_c
  - Game_Type\_\_c (Regular Season/Playoff/Exhibition/Tournament)
  - Status\_\_c (Scheduled/In Progress/Completed/Cancelled/Postponed)
  - Home_Score\_\_c
  - Away_Score\_\_c
  - Division\_\_c (Lookup)

**Game_Roster\_\_c**

- Purpose: Track player attendance and in-game stats
- Key Fields:
  - Game\_\_c (Lookup)
  - Team_Member\_\_c (Lookup)
  - Attended\_\_c (Boolean)
  - Goals\_\_c (Number)
  - Assists\_\_c (Number)
  - Penalties\_\_c (Number)
  - Penalty_Minutes\_\_c (Number)
  - Plus_Minus\_\_c (Number)

#### Statistics

**Player_Season_Stats\_\_c**

- Purpose: Aggregated season statistics per player
- Key Fields:
  - Contact\_\_c (Lookup - the player)
  - Season\_\_c (Lookup)
  - Team\_\_c (Lookup)
  - Games_Played\_\_c (rollup or calculated)
  - Goals\_\_c (rollup)
  - Assists\_\_c (rollup)
  - Points\_\_c (formula: Goals + Assists)
  - Penalties\_\_c (rollup)
  - Penalty_Minutes\_\_c (rollup)
- Unique: Contact + Season (via validation rule)

**Goalie_Season_Stats\_\_c**

- Purpose: Specialized goalie statistics
- Key Fields:
  - Contact\_\_c (Lookup)
  - Season\_\_c (Lookup)
  - Games_Played\_\_c
  - Wins\_\_c, Losses\_\_c, Ties\_\_c
  - Saves\_\_c
  - Goals_Against\_\_c
  - Save_Percentage\_\_c (formula)
  - Goals_Against_Average\_\_c (formula)
  - Shutouts\_\_c

#### Registration & Tryouts

**Registration\_\_c**

- Purpose: Player season registration
- Key Fields:
  - Contact\_\_c (Lookup - player)
  - Season\_\_c (Lookup)
  - Division_Preference\_\_c
  - Status\_\_c (Pending/Approved/Rejected/Waitlisted)
  - Payment_Status\_\_c (Unpaid/Partial/Paid/Refunded)
  - Payment_Amount\_\_c
  - Medical_Form_Submitted\_\_c
  - Registration_Date\_\_c

**Tryout\_\_c**

- Purpose: Tryout sessions
- Key Fields:
  - Division\_\_c (Lookup)
  - DateTime\_\_c
  - Arena\_\_c (Lookup)
  - Max_Participants\_\_c
  - Status\_\_c

**Tryout_Evaluation\_\_c**

- Purpose: Player evaluation during tryouts
- Key Fields:
  - Tryout\_\_c (Lookup)
  - Contact\_\_c (Lookup - player being evaluated)
  - Evaluator\_\_c (Lookup to Contact - the evaluator)
  - Skating_Score\_\_c (1-10)
  - Shooting_Score\_\_c (1-10)
  - Hockey_Sense_Score\_\_c (1-10)
  - Overall_Score\_\_c (calculated)
  - Comments\_\_c (Long Text Area)

#### Content Management

**News_Article\_\_c**

- Purpose: League news and announcements
- Key Fields:
  - Title\_\_c
  - Body\_\_c (Rich Text Area)
  - Author\_\_c (Lookup to User)
  - Publish_Date\_\_c
  - Featured\_\_c (Boolean - for homepage)
  - Category\_\_c (News/Announcement/Tournament/Event)
  - Status\_\_c (Draft/Published/Archived)

**Page_Content\_\_c**

- Purpose: Flexible content blocks for custom pages
- Key Fields:
  - Page_Name\_\_c (About/Rules/Contact/etc.)
  - Section\_\_c (Header/Body/Sidebar)
  - Content\_\_c (Rich Text Area)
  - Order\_\_c (for sorting)
  - Active\_\_c

#### Tournaments

**Tournament\_\_c**

- Purpose: Special tournament events
- Key Fields:
  - Name
  - Start_Date\_\_c, End_Date\_\_c
  - Host_Arena\_\_c (Lookup to Arena\_\_c)
  - Format\_\_c (Round Robin/Single Elimination/Double Elimination)
  - Entry_Fee\_\_c
  - Max_Teams\_\_c
  - Status\_\_c

**Tournament_Team\_\_c**

- Purpose: Junction for tournament participation
- Key Fields:
  - Tournament\_\_c (Lookup)
  - Team\_\_c (Lookup)
  - Pool\_\_c (Pool A/B/C/etc.)
  - Seed\_\_c
  - Wins\_\_c, Losses\_\_c, Ties\_\_c
  - Goals_For\_\_c, Goals_Against\_\_c
  - Standing\_\_c (calculated ranking)

## Security & Sharing

### Object-Level Security (Profiles)

**System Administrator**

- Full CRUD on all objects

**League Convenor**

- CRUD on League, Season, Division, Team, Contact, Arena, Game
- Read on Statistics objects
- CRUD on Registration, Tryout

**Scheduler**

- CRUD on Game, Arena
- Read on Team, Division, Season

**Webmaster**

- CRUD on News_Article\_\_c, Page_Content\_\_c
- Read on League, Team, Game

**Team Manager (External)**

- Read on Game, Arena, Division, Season
- Edit on Team_Member\_\_c (own team only - via sharing)
- Edit on Game_Roster\_\_c (own team only)
- Read on Player_Season_Stats\_\_c (own team)

**Coach (External)**

- Similar to Team Manager

**Player (External)**

- Read on Game, Arena, Team
- Read on own Player_Season_Stats\_\_c

### Organization-Wide Defaults (OWD)

- **Contact**: Private (family data is sensitive)
- **Team\_\_c**: Public Read Only
- **Game\_\_c**: Public Read Only
- **League\_\_c, Season\_\_c, Division\_\_c**: Public Read Only
- **Registration\_\_c**: Private
- **Tryout_Evaluation\_\_c**: Private
- **Player_Season_Stats\_\_c**: Public Read Only
- **News_Article\_\_c**: Public Read Only

### Sharing Rules

**Apex Managed Sharing**:

- Team Managers and Coaches get Read/Write access to:
  - Their Team_Member\_\_c records
  - Their Game_Roster\_\_c records
  - Their team's Player_Season_Stats\_\_c records

Implementation: Create `Team__Share` records via Apex trigger on Team_Member\_\_c when Role = 'Manager' or 'Coach'

**Sharing Sets** (for Experience Cloud):

- Public Site: Access via sharing sets based on public data
- Team Portal: Grant access based on Team_Member\_\_c relationships

## Integration Architecture

### External Scheduling/Rink Systems

**Pattern**: Bidirectional API integration

**Inbound** (Arena bookings → Salesforce):

- Custom REST endpoint: `/services/apexrest/v1/arena/bookings`
- Webhook from arena booking system
- Apex class processes JSON payload
- Creates or updates Game\_\_c records
- Detects conflicts via Flow

**Outbound** (Salesforce → Arena system):

- Apex callout when Game\_\_c is created/updated
- Platform Event triggers async callout
- Named Credential for authentication
- Queueable Apex for retry logic

**Conflict Detection**:

- Flow checks for overlapping games at same arena
- Email alert to scheduler if conflict detected

### Third-Party Statistics Platforms

**Pattern**: Scheduled batch synchronization

**Outbound** (Game results → Stats platform):

- Scheduled batch Apex runs nightly
- Queries completed games from last 24 hours
- Transforms to external API format
- POST to stats platform API
- Updates Game\_\_c with sync status

**Inbound** (Stats platform → Salesforce):

- REST endpoint for webhooks
- Updates Player_Season_Stats\_\_c
- Recalculates rollup summaries

**Player Matching**:

- Use Hockey_Registration_Number\_\_c as unique identifier
- Fallback to Name + Date of Birth matching
- Manual resolution for conflicts

### Email/SMS Communications

**Email**:

- Salesforce Email Alerts for standard notifications
- Custom Email Templates (Visualforce or Lightning)
- Scheduled Flow for game reminders (24 hours before)
- Apex Email Service for complex scenarios

**SMS** (via Twilio):

- Named Credential for Twilio API
- Apex callout wrapper class: `TwilioService.cls`
- Platform Event triggers SMS for urgent notifications
- Custom setting for phone number opt-in tracking

**Notification Framework**:

```
Platform Event: Notification__e
  ↓
Flow/Apex subscribes
  ↓
Determine channel (Email/SMS/Both)
  ↓
Send via appropriate service
```

## Development Guidelines

### Code Standards

**Naming Conventions**:

- Custom Objects: `ObjectName__c`
- Custom Fields: `Field_Name__c` (underscores, PascalCase words)
- Apex Classes: `PascalCase` (e.g., `TeamService`, `GameTriggerHandler`)
- Apex Methods: `camelCase` (e.g., `calculateSeasonStats`)
- LWC Components: `camelCase` (e.g., `scheduleBuilder`, `teamRoster`)
- Test Classes: `ClassName + Test` (e.g., `TeamServiceTest`)

**File Structure**:

```
force-app/main/default/
├── classes/
│   ├── services/          # Business logic
│   ├── handlers/          # Trigger handlers
│   ├── selectors/         # Query logic (SOQL)
│   ├── controllers/       # LWC controllers
│   └── tests/             # Test classes
├── triggers/
├── lwc/
│   └── componentName/
│       ├── componentName.html
│       ├── componentName.js
│       ├── componentName.css
│       └── componentName.js-meta.xml
├── flows/
├── objects/
├── tabs/
├── applications/
└── experiences/
```

### Apex Architecture Pattern

**Trigger Handler Pattern**:

```apex
// Trigger
trigger TeamTrigger on Team__c (before insert, before update, after insert, after update) {
    new TeamTriggerHandler().run();
}

// Handler
public class TeamTriggerHandler extends TriggerHandler {
    protected override void beforeInsert() {
        TeamService.validateTeamData((List<Team__c>) Trigger.new);
    }

    protected override void afterInsert() {
        TeamService.createDefaultRoster((List<Team__c>) Trigger.new);
    }
}

// Service (business logic)
public class TeamService {
    public static void validateTeamData(List<Team__c> teams) {
        // Validation logic
    }

    public static void createDefaultRoster(List<Team__c> teams) {
        // Business logic
    }
}

// Selector (queries)
public class TeamSelector {
    public static List<Team__c> getTeamsByDivision(Id divisionId) {
        return [SELECT Id, Name FROM Team__c WHERE Division__c = :divisionId];
    }
}
```

**LWC Controller Pattern**:

```apex
public with sharing class TeamRosterController {
  @AuraEnabled(cacheable=true)
  public static List<Team_Member__c> getTeamRoster(Id teamId) {
    return TeamMemberSelector.getRosterByTeam(teamId);
  }

  @AuraEnabled
  public static void updateJerseyNumber(Id memberId, Integer jerseyNumber) {
    TeamMemberService.updateJerseyNumber(memberId, jerseyNumber);
  }
}
```

### Testing Standards

**Coverage Requirements**:

- Minimum 75% code coverage (Salesforce standard)
- Target 85%+ for critical business logic
- 100% coverage for service classes

**Test Data Factory**:

```apex
@isTest
public class TestDataFactory {
  public static League__c createLeague(String name) {
    return new League__c(Name = name, Region__c = 'Ontario');
  }

  public static Season__c createSeason(Id leagueId) {
    return new Season__c(
      League__c = leagueId,
      Start_Date__c = Date.today(),
      End_Date__c = Date.today().addMonths(6)
    );
  }
  // ... more factory methods
}
```

**Test Class Template**:

```apex
@isTest
private class TeamServiceTest {
  @TestSetup
  static void setupTestData() {
    League__c league = TestDataFactory.createLeague('Test League');
    insert league;

    Season__c season = TestDataFactory.createSeason(league.Id);
    insert season;
  }

  @isTest
  static void testValidateTeamData_Success() {
    // Test positive scenario
  }

  @isTest
  static void testValidateTeamData_InvalidData() {
    // Test negative scenario
  }
}
```

### LWC Best Practices

**Component Structure**:

- Keep components small and focused (single responsibility)
- Use composition over inheritance
- Leverage base components from `lightning` namespace
- Implement error handling with `try-catch` and user-friendly messages

**Performance**:

- Use `@wire` for cacheable data
- Implement `@AuraEnabled(cacheable=true)` for read operations
- Use Lightning Data Service (LDS) when possible
- Minimize server round-trips

**Example Component**:

```javascript
// teamRoster.js
import { LightningElement, api, wire } from "lwc";
import getTeamRoster from "@salesforce/apex/TeamRosterController.getTeamRoster";

export default class TeamRoster extends LightningElement {
  @api teamId;
  roster;
  error;

  @wire(getTeamRoster, { teamId: "$teamId" })
  wiredRoster({ error, data }) {
    if (data) {
      this.roster = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.roster = undefined;
    }
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (8-10 weeks)

**Objectives**: Core data model and basic admin functionality

**Tasks**:

1. Create custom objects (League, Season, Division, Team, Contact extensions)
2. Build basic Lightning App for admins
3. Implement Team and Player management
4. Create validation rules and workflows
5. Set up security model (profiles, OWD, sharing rules)
6. Basic reporting

**Deliverables**:

- Functional admin app with CRUD operations
- Team and player management
- Basic security implementation

### Phase 2: Public Experience Site (6-8 weeks)

**Objectives**: Public-facing information portal

**Tasks**:

1. Set up Experience Cloud site (unauthenticated)
2. Create custom LWC components:
   - Schedule viewer
   - Standings table
   - Team roster display
   - News article list/detail
3. Build content management system
4. Implement registration form
5. Configure caching and performance optimization

**Deliverables**:

- Live public site with schedules and standings
- Content management for news/articles
- Public registration workflow

### Phase 3: Team Management Portal (6-8 weeks)

**Objectives**: Authenticated portal for team staff and players

**Tasks**:

1. Set up Experience Cloud site (authenticated)
2. Create custom profiles for Team Manager, Coach, Player
3. Implement Apex sharing for team-based access
4. Build team management LWC components:
   - Team dashboard
   - Roster editor
   - Game roster submission
   - Statistics viewer
5. Configure personalized dashboards

**Deliverables**:

- Team portal with role-based access
- Roster and game management features
- Personal statistics tracking

### Phase 4: Advanced Features (8-12 weeks)

**Objectives**: Scheduling, tryouts, tournaments, integrations

**Tasks**:

1. **Schedule Builder (CALENDAR REFACTOR IN PROGRESS)**:
   - ✅ Fully designed: Custom LWC drag-and-drop calendar with SLDS styling
   - ✅ 4 views designed: Month, Week (primary), Day, Gantt
   - ✅ Conflict detection logic specified
   - ✅ See [docs/CALENDAR_REFACTOR_DESIGN_PLAN.md](./docs/CALENDAR_REFACTOR_DESIGN_PLAN.md) for details
   - TODO: Implement components (Week 1-5)
2. **Tryout Management**:
   - Tryout evaluation mobile UI
   - Scoring and ranking system
3. **Tournament Tracking**:
   - Bracket generation
   - Tournament standings
4. **Statistics Engine**:
   - Automated stat calculation (Flow + Apex)
   - Leaderboards
5. **Integrations**:
   - Arena booking system API
   - Statistics platform sync
   - Twilio SMS setup

**Deliverables**:

- ✅ Complete scheduling system (design)
- Tryout evaluation workflow
- Tournament management
- External integrations

### Phase 5: Optimization & Polish (4-6 weeks)

**Objectives**: Performance tuning and enhancements

**Tasks**:

1. Performance optimization
   - Query optimization
   - Platform caching
   - Experience Cloud CDN configuration
2. Mobile app enhancements
3. Einstein Analytics dashboards
4. User acceptance testing (UAT)
5. Documentation and training materials
6. Data migration from legacy systems

**Deliverables**:

- Production-ready system
- Performance benchmarks met
- Documentation complete
- User training delivered

## Current Status

**Current Initiative**: Calendar Refactor (FullCalendar → Custom LWC + SLDS)

**Phase**: Design Complete ✅ | Implementation Starting 🚀

**Completed**:

- Salesforce DX project initialized
- Git repository configured
- Code quality tools set up (ESLint, Prettier, Husky)
- Project documentation (README.md, CLAUDE.md)
- **Calendar Refactor Design Phase** (150+ pages of specifications):
  - Comprehensive design plan with requirements & architecture
  - Visual mockups for all 4 calendar views (Month, Week, Day, Gantt)
  - Detailed component architecture with code examples
  - Headless CalendarService design (business logic layer)
  - Apex controller specifications
  - Data models & interfaces
  - Performance optimization strategy
  - Accessibility requirements (WCAG 2.1 AA)
  - Implementation roadmap

**Next Steps** (Implementation Phase - Week 1-5):

1. **Week 1**: Foundation (CalendarService, Apex controllers, basic UI structure)
2. **Week 2**: Week View (primary interface - time grid, drag-drop, quick create)
3. **Week 3**: Other Views (Month refinements, Day view, Gantt view)
4. **Week 4**: Optimization (virtual scrolling, caching, accessibility polish)
5. **Week 5**: Testing & deployment (unit/integration tests, UAT, production deployment)

**Design Documentation** (Reference these files):

- [docs/CALENDAR_REFACTOR_DESIGN_PLAN.md](./docs/CALENDAR_REFACTOR_DESIGN_PLAN.md)
- [docs/CALENDAR_VISUAL_MOCKUPS.md](./docs/CALENDAR_VISUAL_MOCKUPS.md)
- [docs/COMPONENT_ARCHITECTURE.md](./docs/COMPONENT_ARCHITECTURE.md)
- [docs/DESIGN_SUMMARY.md](./docs/DESIGN_SUMMARY.md)

## AI Assistant Guidelines

When working on this project:

1. **Check the Calendar Refactor Design** first (if working on calendar/scheduling)
   - Reference [docs/CALENDAR_REFACTOR_DESIGN_PLAN.md](./docs/CALENDAR_REFACTOR_DESIGN_PLAN.md) for vision & architecture
   - Reference [docs/COMPONENT_ARCHITECTURE.md](./docs/COMPONENT_ARCHITECTURE.md) for component specs
   - Reference [docs/CALENDAR_VISUAL_MOCKUPS.md](./docs/CALENDAR_VISUAL_MOCKUPS.md) for UI layouts
2. **Always check existing patterns** before creating new code
3. **Follow the naming conventions** strictly
4. **Write tests first** for critical business logic (TDD approach)
5. **Use the established architecture** (handlers, services, selectors)
6. **Consider governor limits** - bulkify all operations
7. **Document complex logic** with ApexDoc comments
8. **Ask clarifying questions** if requirements are ambiguous
9. **Reference this document** for architectural decisions
10. **Update this document** when making significant architectural changes
11. **Use Salesforce CLI** commands (sf) instead of legacy (sfdx)

## Useful Commands

```bash
# Create scratch org
sf org create scratch -f config/project-scratch-def.json -a sportsforce-dev

# Deploy metadata
sf project deploy start

# Run Apex tests
sf apex run test --test-level RunLocalTests --result-format human

# Execute anonymous Apex
sf apex run --file scripts/apex/script.apex

# Open org
sf org open

# View org limits
sf limits api display

# Generate password for user
sf org generate password

# Export data
sf data export tree --query "SELECT Id, Name FROM Team__c" --output-dir data

# Import data
sf data import tree --plan data/import-plan.json
```

## Questions or Clarifications Needed

- Payment gateway preference (Stripe, PayPal, native Salesforce?)
- Document upload requirements for registration (medical forms, waivers)
- Referee/official management scope
- Video highlight integration requirements
- Historical data migration volume and format

---

**Last Updated**: 2025-11-05
**Version**: 1.1 (Calendar Refactor Design Phase Added)
**Maintained By**: Development Team

**Version History**:

- v1.1 (2025-11-05): Added Calendar Refactor Initiative section with comprehensive design documentation
- v1.0 (2025-10-29): Initial project context and architecture documentation

**Generic coding guidelines**

- when starting a new LWC, always start with the jest tests. Try to do TDD as much as possible and use sf lightning dev (local development)
- when wiring LWC to data, always prefer using GraphQL wires if possible. If not possible, then default to Apex
- use the latest API version available in the org (curently 65.0) when creating new metadata
