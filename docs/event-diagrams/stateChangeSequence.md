
# State Change Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant StateMachine
    participant DB
    participant EventService
    participant NotificationService
    participant Listeners

    Client->>API: PATCH /communicationMessage/{id} (state change)
    API->>DB: Get message by ID
    DB-->>API: Return message
    API->>StateMachine: Validate transition
    StateMachine-->>API: Transition valid/invalid
    
    alt Valid transition
        API->>DB: Update message state
        DB-->>API: Return updated message
        API->>EventService: Create StateChangeEvent
        EventService->>DB: Save event
        EventService->>Listeners: Notify listeners
        Listeners-->>EventService: ACK
        API->>NotificationService: Send notification
        NotificationService-->>API: Notification sent
        API-->>Client: Return updated message
    else Invalid transition
        API-->>Client: Return 400 Bad Request
    end