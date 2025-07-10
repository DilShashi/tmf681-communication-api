# Attribute Change Event Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant EventService
    participant Listeners

    Client->>API: PATCH /communicationMessage/{id}
    API->>DB: Get message by ID
    DB-->>API: Return message
    API->>API: Track attribute changes
    API->>DB: Save updated message
    DB-->>API: Return updated message
    
    alt Attributes changed
        API->>EventService: Create AttributeChangeEvent
        EventService->>DB: Save event
        EventService->>Listeners: Notify listeners
        Listeners-->>EventService: ACK
    end
    
    API-->>Client: Return updated message