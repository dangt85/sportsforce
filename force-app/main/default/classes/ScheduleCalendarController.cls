public with sharing class ScheduleCalendarController {
  /**
   * Calendar event wrapper for FullCalendar.js
   */
  public class CalendarEvent {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String title;
    @AuraEnabled
    public DateTime startTime;
    @AuraEnabled
    public DateTime endTime;
    @AuraEnabled
    public String eventType; // 'Game', 'Tryout', 'Practice'
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String location;
    @AuraEnabled
    public String backgroundColor;

    public CalendarEvent(
      String id,
      String title,
      DateTime startTime,
      DateTime endTime,
      String eventType,
      String status,
      String location,
      String backgroundColor
    ) {
      this.id = id;
      this.title = title;
      this.startTime = startTime;
      this.endTime = endTime;
      this.eventType = eventType;
      this.status = status;
      this.location = location;
      this.backgroundColor = backgroundColor;
    }
  }

  /**
   * Response wrapper for calendar events with filtering support
   */
  public class EventsResponse {
    @AuraEnabled
    public Boolean success;
    @AuraEnabled
    public List<CalendarEvent> allEvents;
    @AuraEnabled
    public Integer totalRecords;
    @AuraEnabled
    public String errorMessage;

    public EventsResponse(
      Boolean success,
      List<CalendarEvent> events,
      Integer total
    ) {
      this.success = success;
      this.allEvents = events;
      this.totalRecords = total;
      this.errorMessage = '';
    }

    public EventsResponse(Boolean success, String error) {
      this.success = success;
      this.allEvents = new List<CalendarEvent>();
      this.totalRecords = 0;
      this.errorMessage = error;
    }
  }

  /**
   * Fetch events by date range with optional filtering
   * Supports filtering by teams, event types, arenas, and divisions
   *
   * @param startDate Calendar view start date
   * @param endDate Calendar view end date
   * @param teamIds Optional list of team IDs to filter by
   * @param eventTypes Optional list of event types (Game, Tryout, Practice)
   * @param arenaIds Optional list of arena IDs to filter by
   * @param divisionIds Optional list of division IDs to filter by
   * @return EventsResponse with filtered events
   */
  @AuraEnabled
  public static EventsResponse getEventsByDateRange(
    Date startDate,
    Date endDate,
    List<String> teamIds,
    List<String> eventTypes,
    List<String> arenaIds,
    List<String> divisionIds
  ) {
    try {
      List<CalendarEvent> allEvents = getEvents(startDate, endDate);
      List<CalendarEvent> filteredEvents = new List<CalendarEvent>();

      // Apply filters
      for (CalendarEvent event : allEvents) {
        Boolean passesFilter = true;

        // Filter by event type
        if (eventTypes != null && !eventTypes.isEmpty()) {
          if (!eventTypes.contains(event.eventType)) {
            passesFilter = false;
          }
        }

        // Filter by location (arena)
        if (passesFilter && arenaIds != null && !arenaIds.isEmpty()) {
          if (!arenaIds.contains(event.location)) {
            passesFilter = false;
          }
        }

        if (passesFilter) {
          filteredEvents.add(event);
        }
      }

      return new EventsResponse(true, filteredEvents, filteredEvents.size());
    } catch (Exception e) {
      return new EventsResponse(
        false,
        'Error fetching events: ' + e.getMessage()
      );
    }
  }

  /**
   * Fetch events (Games, Tryouts, Practices) for calendar display
   * @param startDate Calendar view start date
   * @param endDate Calendar view end date
   * @return List of calendar events
   */
  @AuraEnabled(cacheable=true)
  public static List<CalendarEvent> getEvents(Date startDate, Date endDate) {
    List<CalendarEvent> events = new List<CalendarEvent>();

    // Fetch Games
    List<Game__c> games = [
      SELECT
        Id,
        Name,
        Game_DateTime__c,
        Duration_Minutes__c,
        Home_Team__r.Name,
        Away_Team__r.Name,
        Arena__r.Name,
        Status__c
      FROM Game__c
      WHERE
        Game_DateTime__c >= :DateTime.newInstance(
          startDate,
          Time.newInstance(0, 0, 0, 0)
        )
        AND Game_DateTime__c < :DateTime.newInstance(
          endDate.addDays(1),
          Time.newInstance(0, 0, 0, 0)
        )
      ORDER BY Game_DateTime__c ASC
    ];

    for (Game__c game : games) {
      String title = game.Home_Team__r.Name + ' vs ' + game.Away_Team__r.Name;
      Integer durationMinutes = game.Duration_Minutes__c != null
        ? (Integer) game.Duration_Minutes__c
        : 60;
      DateTime endTime = game.Game_DateTime__c.addMinutes(durationMinutes);
      String backgroundColor = getGameColor(game.Status__c);

      events.add(
        new CalendarEvent(
          game.Id,
          title,
          game.Game_DateTime__c,
          endTime,
          'Game',
          game.Status__c,
          game.Arena__r.Name,
          backgroundColor
        )
      );
    }

    // Fetch Tryouts
    List<Tryout__c> tryouts = [
      SELECT
        Id,
        Name,
        DateTime__c,
        Duration_Minutes__c,
        Division__r.Name,
        Arena__r.Name,
        Status__c
      FROM Tryout__c
      WHERE
        DateTime__c >= :DateTime.newInstance(
          startDate,
          Time.newInstance(0, 0, 0, 0)
        )
        AND DateTime__c < :DateTime.newInstance(
          endDate.addDays(1),
          Time.newInstance(0, 0, 0, 0)
        )
      ORDER BY DateTime__c ASC
    ];

    for (Tryout__c tryout : tryouts) {
      String title = 'Tryout: ' + tryout.Division__r.Name;
      Integer durationMinutes = tryout.Duration_Minutes__c != null
        ? (Integer) tryout.Duration_Minutes__c
        : 90;
      DateTime endTime = tryout.DateTime__c.addMinutes(durationMinutes);
      String backgroundColor = getTryoutColor(tryout.Status__c);

      events.add(
        new CalendarEvent(
          tryout.Id,
          title,
          tryout.DateTime__c,
          endTime,
          'Tryout',
          tryout.Status__c,
          tryout.Arena__r.Name,
          backgroundColor
        )
      );
    }

    // Fetch Practices
    List<Practice__c> practices = [
      SELECT
        Id,
        Name,
        DateTime__c,
        Duration_Minutes__c,
        Team__r.Name,
        Arena__r.Name,
        Status__c
      FROM Practice__c
      WHERE
        DateTime__c >= :DateTime.newInstance(
          startDate,
          Time.newInstance(0, 0, 0, 0)
        )
        AND DateTime__c < :DateTime.newInstance(
          endDate.addDays(1),
          Time.newInstance(0, 0, 0, 0)
        )
      ORDER BY DateTime__c ASC
    ];

    for (Practice__c practice : practices) {
      String title = 'Practice: ' + practice.Team__r.Name;
      Integer durationMinutes = practice.Duration_Minutes__c != null
        ? (Integer) practice.Duration_Minutes__c
        : 60;
      DateTime endTime = practice.DateTime__c.addMinutes(durationMinutes);
      String backgroundColor = getPracticeColor(practice.Status__c);

      events.add(
        new CalendarEvent(
          practice.Id,
          title,
          practice.DateTime__c,
          endTime,
          'Practice',
          practice.Status__c,
          practice.Arena__r.Name,
          backgroundColor
        )
      );
    }

    return events;
  }

  /**
   * Update event (Game, Tryout, or Practice) with new date/time
   * Used for drag-and-drop calendar updates
   * @param objectType Type of object to update ('Game', 'Tryout', 'Practice')
   * @param recordId Record ID to update
   * @param newDateTime New date/time for the event
   * @param newDuration New duration in minutes (optional)
   * @return true if update successful, throws exception if arena conflict detected
   */
  @AuraEnabled
  public static Boolean updateEvent(
    String objectType,
    Id recordId,
    DateTime newDateTime,
    Integer newDuration
  ) {
    if (objectType == 'Game') {
      Game__c game = [
        SELECT Id, Arena__c, Duration_Minutes__c
        FROM Game__c
        WHERE Id = :recordId
      ];

      // Check for arena conflicts
      if (
        checkArenaConflict(
          game.Arena__c,
          newDateTime,
          newDateTime.addMinutes(newDuration != null ? newDuration : 60),
          recordId
        )
      ) {
        throw new AuraHandledException(
          'Arena conflict: Another event is scheduled at this time'
        );
      }

      game.Game_DateTime__c = newDateTime;
      if (newDuration != null) {
        game.Duration_Minutes__c = newDuration;
      }
      update game;
    } else if (objectType == 'Tryout') {
      Tryout__c tryout = [
        SELECT Id, Arena__c, Duration_Minutes__c
        FROM Tryout__c
        WHERE Id = :recordId
      ];

      // Check for arena conflicts
      if (
        checkArenaConflict(
          tryout.Arena__c,
          newDateTime,
          newDateTime.addMinutes(newDuration != null ? newDuration : 90),
          recordId
        )
      ) {
        throw new AuraHandledException(
          'Arena conflict: Another event is scheduled at this time'
        );
      }

      tryout.DateTime__c = newDateTime;
      if (newDuration != null) {
        tryout.Duration_Minutes__c = newDuration;
      }
      update tryout;
    } else if (objectType == 'Practice') {
      Practice__c practice = [
        SELECT Id, Arena__c, Duration_Minutes__c
        FROM Practice__c
        WHERE Id = :recordId
      ];

      // Check for arena conflicts
      if (
        checkArenaConflict(
          practice.Arena__c,
          newDateTime,
          newDateTime.addMinutes(newDuration != null ? newDuration : 60),
          recordId
        )
      ) {
        throw new AuraHandledException(
          'Arena conflict: Another event is scheduled at this time'
        );
      }

      practice.DateTime__c = newDateTime;
      if (newDuration != null) {
        practice.Duration_Minutes__c = newDuration;
      }
      update practice;
    }

    return true;
  }

  /**
   * Delete an event (Game, Tryout, or Practice)
   * @param objectType Type of object to delete ('Game', 'Tryout', 'Practice')
   * @param recordId Record ID to delete
   * @return true if delete successful
   */
  @AuraEnabled
  public static Boolean deleteEvent(String objectType, Id recordId) {
    if (objectType == 'Game') {
      delete new Game__c(Id = recordId);
    } else if (objectType == 'Tryout') {
      delete new Tryout__c(Id = recordId);
    } else if (objectType == 'Practice') {
      delete new Practice__c(Id = recordId);
    }
    return true;
  }

  /**
   * Check for arena booking conflicts
   * @param arenaId Arena to check
   * @param startTime Event start time
   * @param endTime Event end time
   * @param excludeRecordId Record ID to exclude from check (for updates)
   * @return true if conflict detected, false if arena is available
   */
  public static Boolean checkArenaConflict(
    Id arenaId,
    DateTime startTime,
    DateTime endTime,
    Id excludeRecordId
  ) {
    // Check Games
    List<Game__c> games = [
      SELECT Id, Game_DateTime__c, Duration_Minutes__c
      FROM Game__c
      WHERE
        Arena__c = :arenaId
        AND Status__c NOT IN ('Cancelled', 'Postponed')
        AND Id != :excludeRecordId
      LIMIT 100
    ];

    for (Game__c game : games) {
      DateTime gameEnd = game.Game_DateTime__c.addMinutes(
        game.Duration_Minutes__c != null
          ? (Integer) game.Duration_Minutes__c
          : 60
      );
      if (hasTimeConflict(game.Game_DateTime__c, gameEnd, startTime, endTime)) {
        return true;
      }
    }

    // Check Tryouts
    List<Tryout__c> tryouts = [
      SELECT Id, DateTime__c, Duration_Minutes__c
      FROM Tryout__c
      WHERE
        Arena__c = :arenaId
        AND Status__c NOT IN ('Cancelled')
        AND Id != :excludeRecordId
      LIMIT 100
    ];

    for (Tryout__c tryout : tryouts) {
      DateTime tryoutEnd = tryout.DateTime__c.addMinutes(
        tryout.Duration_Minutes__c != null
          ? (Integer) tryout.Duration_Minutes__c
          : 90
      );
      if (hasTimeConflict(tryout.DateTime__c, tryoutEnd, startTime, endTime)) {
        return true;
      }
    }

    // Check Practices
    List<Practice__c> practices = [
      SELECT Id, DateTime__c, Duration_Minutes__c
      FROM Practice__c
      WHERE
        Arena__c = :arenaId
        AND Status__c != 'Cancelled'
        AND Id != :excludeRecordId
      LIMIT 100
    ];

    for (Practice__c practice : practices) {
      DateTime practiceEnd = practice.DateTime__c.addMinutes(
        practice.Duration_Minutes__c != null
          ? (Integer) practice.Duration_Minutes__c
          : 60
      );
      if (
        hasTimeConflict(practice.DateTime__c, practiceEnd, startTime, endTime)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper method to check if two time ranges overlap
   */
  private static Boolean hasTimeConflict(
    DateTime event1Start,
    DateTime event1End,
    DateTime event2Start,
    DateTime event2End
  ) {
    // Two time ranges conflict if one starts before the other ends
    return event1Start < event2End && event1End > event2Start;
  }

  /**
   * Helper method to get color for game status
   */
  private static String getGameColor(String status) {
    switch on status {
      when 'Completed' {
        return '#28a745'; // Green
      }
      when 'Cancelled' {
        return '#dc3545'; // Red
      }
      when 'Postponed' {
        return '#ffc107'; // Yellow
      }
      when else {
        return '#0070d2'; // Blue (Scheduled, In Progress)
      }
    }
  }

  /**
   * Helper method to get color for tryout status
   */
  private static String getTryoutColor(String status) {
    switch on status {
      when 'Completed' {
        return '#28a745'; // Green
      }
      when 'Cancelled' {
        return '#dc3545'; // Red
      }
      when else {
        return '#17a2b8'; // Cyan (Scheduled, In Progress)
      }
    }
  }

  /**
   * Helper method to get color for practice status
   */
  private static String getPracticeColor(String status) {
    switch on status {
      when 'Completed' {
        return '#28a745'; // Green
      }
      when 'Cancelled' {
        return '#dc3545'; // Red
      }
      when else {
        return '#fd7e14'; // Orange (Scheduled, Completed)
      }
    }
  }
}
