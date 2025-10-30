@isTest
private class ScheduleCalendarControllerTest {
  // Test data factory methods
  static League__c testLeague;
  static Season__c testSeason;
  static Division__c testDivision;
  static Arena__c testArena;
  static Team__c testTeam1;
  static Team__c testTeam2;

  @TestSetup
  static void setupTestData() {
    // Create league
    testLeague = new League__c(Name = 'Test League', Region__c = 'Ontario');
    insert testLeague;

    // Create season
    testSeason = new Season__c(
      League__c = testLeague.Id,
      Start_Date__c = Date.today(),
      End_Date__c = Date.today().addMonths(6),
      Status__c = 'Active'
    );
    insert testSeason;

    // Create division
    testDivision = new Division__c(
      Season__c = testSeason.Id,
      Name = 'Atom AA',
      Min_Age__c = 9,
      Max_Age__c = 10,
      Skill_Level__c = 'AA'
    );
    insert testDivision;

    // Create arena
    testArena = new Arena__c(
      Name = 'Test Arena',
      Address__c = '123 Main St',
      City__c = 'Toronto',
      Province_State__c = 'ON',
      Ice_Surface_Count__c = 2,
      Capacity__c = 500,
      Contact_Email__c = 'contact@arena.com'
    );
    insert testArena;

    // Create teams
    testTeam1 = new Team__c(
      Name = 'Team A',
      Division__c = testDivision.Id,
      Home_Arena__c = testArena.Id
    );
    insert testTeam1;

    testTeam2 = new Team__c(
      Name = 'Team B',
      Division__c = testDivision.Id,
      Home_Arena__c = testArena.Id
    );
    insert testTeam2;
  }

  @isTest
  static void testGetEvents_WithGames() {
    League__c league = [SELECT Id FROM League__c LIMIT 1];
    Season__c season = [SELECT Id FROM Season__c LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];
    Team__c team1 = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Team__c team2 = [SELECT Id FROM Team__c WHERE Name = 'Team B' LIMIT 1];

    DateTime gameTime = DateTime.newInstance(
      Date.today(),
      Time.newInstance(19, 0, 0, 0)
    );

    // Create game
    Game__c game = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = gameTime,
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled',
      Duration_Minutes__c = 60
    );
    insert game;

    Test.startTest();
    List<ScheduleCalendarController.CalendarEvent> events = ScheduleCalendarController.getEvents(
      Date.today(),
      Date.today().addDays(1)
    );
    Test.stopTest();

    Assert.areEqual(1, events.size(), 'Should return 1 game event');
    Assert.areEqual('Game', events[0].eventType);
    Assert.isTrue(events[0].title.contains('Team A'));
    Assert.isTrue(events[0].title.contains('Team B'));
  }

  @isTest
  static void testGetEvents_WithTryouts() {
    Season__c season = [SELECT Id FROM Season__c LIMIT 1];
    Division__c division = [SELECT Id FROM Division__c LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime tryoutTime = DateTime.newInstance(
      Date.today(),
      Time.newInstance(10, 0, 0, 0)
    );

    // Create tryout
    Tryout__c tryout = new Tryout__c(
      Division__c = division.Id,
      DateTime__c = tryoutTime,
      Arena__c = arena.Id,
      Max_Participants__c = 50,
      Status__c = 'Scheduled',
      Duration_Minutes__c = 90
    );
    insert tryout;

    Test.startTest();
    List<ScheduleCalendarController.CalendarEvent> events = ScheduleCalendarController.getEvents(
      Date.today(),
      Date.today().addDays(1)
    );
    Test.stopTest();

    Assert.areEqual(1, events.size(), 'Should return 1 tryout event');
    Assert.areEqual('Tryout', events[0].eventType);
    Assert.isTrue(events[0].title.contains('Tryout'));
  }

  @isTest
  static void testGetEvents_WithPractices() {
    Team__c team = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime practiceTime = DateTime.newInstance(
      Date.today(),
      Time.newInstance(18, 0, 0, 0)
    );

    // Create practice
    Practice__c practice = new Practice__c(
      Team__c = team.Id,
      DateTime__c = practiceTime,
      Arena__c = arena.Id,
      Duration_Minutes__c = 60,
      Practice_Type__c = 'Full Practice',
      Status__c = 'Scheduled'
    );
    insert practice;

    Test.startTest();
    List<ScheduleCalendarController.CalendarEvent> events = ScheduleCalendarController.getEvents(
      Date.today(),
      Date.today().addDays(1)
    );
    Test.stopTest();

    Assert.areEqual(1, events.size(), 'Should return 1 practice event');
    Assert.areEqual('Practice', events[0].eventType);
    Assert.isTrue(events[0].title.contains('Practice'));
  }

  @isTest
  static void testGetEvents_MultipleEventTypes() {
    Team__c team1 = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Team__c team2 = [SELECT Id FROM Team__c WHERE Name = 'Team B' LIMIT 1];
    Division__c division = [SELECT Id FROM Division__c LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime dateTime1 = DateTime.newInstance(
      Date.today(),
      Time.newInstance(10, 0, 0, 0)
    );
    DateTime dateTime2 = DateTime.newInstance(
      Date.today(),
      Time.newInstance(14, 0, 0, 0)
    );
    DateTime dateTime3 = DateTime.newInstance(
      Date.today(),
      Time.newInstance(18, 0, 0, 0)
    );

    // Create game
    Game__c game = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = dateTime1,
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled'
    );
    insert game;

    // Create tryout
    Tryout__c tryout = new Tryout__c(
      Division__c = division.Id,
      DateTime__c = dateTime2,
      Arena__c = arena.Id,
      Max_Participants__c = 50,
      Status__c = 'Scheduled'
    );
    insert tryout;

    // Create practice
    Practice__c practice = new Practice__c(
      Team__c = team1.Id,
      DateTime__c = dateTime3,
      Arena__c = arena.Id,
      Practice_Type__c = 'Full Practice',
      Status__c = 'Scheduled'
    );
    insert practice;

    Test.startTest();
    List<ScheduleCalendarController.CalendarEvent> events = ScheduleCalendarController.getEvents(
      Date.today(),
      Date.today().addDays(1)
    );
    Test.stopTest();

    Assert.areEqual(3, events.size(), 'Should return 3 events total');
  }

  @isTest
  static void testUpdateEvent_Game() {
    Team__c team1 = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Team__c team2 = [SELECT Id FROM Team__c WHERE Name = 'Team B' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime originalTime = DateTime.newInstance(
      Date.today(),
      Time.newInstance(19, 0, 0, 0)
    );
    DateTime newTime = DateTime.newInstance(
      Date.today().addDays(1),
      Time.newInstance(19, 0, 0, 0)
    );

    Game__c game = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = originalTime,
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled'
    );
    insert game;

    Test.startTest();
    Boolean result = ScheduleCalendarController.updateEvent(
      'Game',
      game.Id,
      newTime,
      60
    );
    Test.stopTest();

    Assert.isTrue(result, 'Update should succeed');
    Game__c updatedGame = [
      SELECT Game_DateTime__c
      FROM Game__c
      WHERE Id = :game.Id
    ];
    Assert.areEqual(
      newTime,
      updatedGame.Game_DateTime__c,
      'Game date/time should be updated'
    );
  }

  @isTest
  static void testUpdateEvent_Tryout() {
    Division__c division = [SELECT Id FROM Division__c LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime originalTime = DateTime.newInstance(
      Date.today(),
      Time.newInstance(10, 0, 0, 0)
    );
    DateTime newTime = DateTime.newInstance(
      Date.today().addDays(1),
      Time.newInstance(10, 0, 0, 0)
    );

    Tryout__c tryout = new Tryout__c(
      Division__c = division.Id,
      DateTime__c = originalTime,
      Arena__c = arena.Id,
      Max_Participants__c = 50,
      Status__c = 'Scheduled'
    );
    insert tryout;

    Test.startTest();
    Boolean result = ScheduleCalendarController.updateEvent(
      'Tryout',
      tryout.Id,
      newTime,
      90
    );
    Test.stopTest();

    Assert.isTrue(result, 'Update should succeed');
    Tryout__c updatedTryout = [
      SELECT DateTime__c
      FROM Tryout__c
      WHERE Id = :tryout.Id
    ];
    Assert.areEqual(
      newTime,
      updatedTryout.DateTime__c,
      'Tryout date/time should be updated'
    );
  }

  @isTest
  static void testUpdateEvent_Practice() {
    Team__c team = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime originalTime = DateTime.newInstance(
      Date.today(),
      Time.newInstance(18, 0, 0, 0)
    );
    DateTime newTime = DateTime.newInstance(
      Date.today().addDays(1),
      Time.newInstance(18, 0, 0, 0)
    );

    Practice__c practice = new Practice__c(
      Team__c = team.Id,
      DateTime__c = originalTime,
      Arena__c = arena.Id,
      Practice_Type__c = 'Full Practice',
      Status__c = 'Scheduled'
    );
    insert practice;

    Test.startTest();
    Boolean result = ScheduleCalendarController.updateEvent(
      'Practice',
      practice.Id,
      newTime,
      60
    );
    Test.stopTest();

    Assert.isTrue(result, 'Update should succeed');
    Practice__c updatedPractice = [
      SELECT DateTime__c
      FROM Practice__c
      WHERE Id = :practice.Id
    ];
    Assert.areEqual(
      newTime,
      updatedPractice.DateTime__c,
      'Practice date/time should be updated'
    );
  }

  @isTest
  static void testCheckArenaConflict_GameConflict() {
    Team__c team1 = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Team__c team2 = [SELECT Id FROM Team__c WHERE Name = 'Team B' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime conflictTime = DateTime.newInstance(
      Date.today(),
      Time.newInstance(19, 0, 0, 0)
    );

    Game__c game1 = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = conflictTime,
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled',
      Duration_Minutes__c = 60
    );
    insert game1;

    Test.startTest();
    Boolean hasConflict = ScheduleCalendarController.checkArenaConflict(
      arena.Id,
      conflictTime,
      conflictTime.addMinutes(60),
      null
    );
    Test.stopTest();

    Assert.isTrue(hasConflict, 'Should detect arena conflict');
  }

  @isTest
  static void testCheckArenaConflict_NoConflict() {
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime time1 = DateTime.newInstance(
      Date.today(),
      Time.newInstance(10, 0, 0, 0)
    );
    DateTime time2 = DateTime.newInstance(
      Date.today(),
      Time.newInstance(19, 0, 0, 0)
    );

    Test.startTest();
    Boolean hasConflict = ScheduleCalendarController.checkArenaConflict(
      arena.Id,
      time2,
      time2.addMinutes(60),
      null
    );
    Test.stopTest();

    Assert.isFalse(
      hasConflict,
      'Should not detect conflict when arena is free'
    );
  }

  @isTest
  static void testDeleteEvent_Game() {
    Team__c team1 = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Team__c team2 = [SELECT Id FROM Team__c WHERE Name = 'Team B' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    Game__c game = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = DateTime.now().addDays(1),
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled'
    );
    insert game;
    Id gameId = game.Id;

    Test.startTest();
    Boolean result = ScheduleCalendarController.deleteEvent('Game', gameId);
    Test.stopTest();

    Assert.isTrue(result, 'Delete should succeed');
    List<Game__c> deletedGames = [SELECT Id FROM Game__c WHERE Id = :gameId];
    Assert.areEqual(0, deletedGames.size(), 'Game should be deleted');
  }

  @isTest
  static void testDeleteEvent_Tryout() {
    Division__c division = [SELECT Id FROM Division__c LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    Tryout__c tryout = new Tryout__c(
      Division__c = division.Id,
      DateTime__c = DateTime.now().addDays(1),
      Arena__c = arena.Id,
      Max_Participants__c = 50,
      Status__c = 'Scheduled'
    );
    insert tryout;
    Id tryoutId = tryout.Id;

    Test.startTest();
    Boolean result = ScheduleCalendarController.deleteEvent('Tryout', tryoutId);
    Test.stopTest();

    Assert.isTrue(result, 'Delete should succeed');
    List<Tryout__c> deletedTryouts = [
      SELECT Id
      FROM Tryout__c
      WHERE Id = :tryoutId
    ];
    Assert.areEqual(0, deletedTryouts.size(), 'Tryout should be deleted');
  }

  @isTest
  static void testDeleteEvent_Practice() {
    Team__c team = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    Practice__c practice = new Practice__c(
      Team__c = team.Id,
      DateTime__c = DateTime.now().addDays(1),
      Arena__c = arena.Id,
      Practice_Type__c = 'Full Practice',
      Status__c = 'Scheduled'
    );
    insert practice;
    Id practiceId = practice.Id;

    Test.startTest();
    Boolean result = ScheduleCalendarController.deleteEvent(
      'Practice',
      practiceId
    );
    Test.stopTest();

    Assert.isTrue(result, 'Delete should succeed');
    List<Practice__c> deletedPractices = [
      SELECT Id
      FROM Practice__c
      WHERE Id = :practiceId
    ];
    Assert.areEqual(0, deletedPractices.size(), 'Practice should be deleted');
  }

  @isTest
  static void testUpdateEvent_ArenaConflictDetected() {
    Team__c team1 = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Team__c team2 = [SELECT Id FROM Team__c WHERE Name = 'Team B' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime time1 = DateTime.newInstance(
      Date.today(),
      Time.newInstance(19, 0, 0, 0)
    );
    DateTime time2 = DateTime.newInstance(
      Date.today(),
      Time.newInstance(20, 0, 0, 0)
    );

    Game__c game1 = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = time1,
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled',
      Duration_Minutes__c = 60
    );
    insert game1;

    Game__c game2 = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = time2.addMinutes(120),
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled'
    );
    insert game2;

    Test.startTest();
    try {
      ScheduleCalendarController.updateEvent(
        'Game',
        game2.Id,
        time1.addMinutes(30),
        60
      );
      Assert.fail('Should throw exception for arena conflict');
    } catch (AuraHandledException e) {
      Assert.isTrue(
        e.getMessage().contains('Arena conflict'),
        'Should report arena conflict'
      );
    }
    Test.stopTest();
  }

  @isTest
  static void testGetEvents_DateRangeFiltering() {
    Team__c team1 = [SELECT Id FROM Team__c WHERE Name = 'Team A' LIMIT 1];
    Team__c team2 = [SELECT Id FROM Team__c WHERE Name = 'Team B' LIMIT 1];
    Arena__c arena = [SELECT Id FROM Arena__c LIMIT 1];

    DateTime today = DateTime.newInstance(
      Date.today(),
      Time.newInstance(19, 0, 0, 0)
    );
    DateTime tomorrow = DateTime.newInstance(
      Date.today().addDays(1),
      Time.newInstance(19, 0, 0, 0)
    );

    Game__c game1 = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = today,
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled'
    );
    insert game1;

    Game__c game2 = new Game__c(
      Home_Team__c = team1.Id,
      Away_Team__c = team2.Id,
      Arena__c = arena.Id,
      Game_DateTime__c = tomorrow,
      Game_Type__c = 'Regular Season',
      Status__c = 'Scheduled'
    );
    insert game2;

    Test.startTest();
    List<ScheduleCalendarController.CalendarEvent> todayEvents = ScheduleCalendarController.getEvents(
      Date.today(),
      Date.today()
    );
    List<ScheduleCalendarController.CalendarEvent> nextDayEvents = ScheduleCalendarController.getEvents(
      Date.today().addDays(1),
      Date.today().addDays(1)
    );
    Test.stopTest();

    Assert.areEqual(1, todayEvents.size(), 'Should return 1 event for today');
    Assert.areEqual(
      1,
      nextDayEvents.size(),
      'Should return 1 event for tomorrow'
    );
  }
}
