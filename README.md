# Communication Service

TM Forum Communication Management API v4.0.0 implementation

## Features

- **Communication Message Management**:
  - Create, read, update, and delete communication messages
  - Support for SMS, Email, and Mobile App Push notifications
  - Message state management (initial, inProgress, completed, cancelled, failed)

- **Event Notifications**:
  - State change events
  - Attribute change events
  - Listener registration via Hub

- **TM Forum Compliance**:
  - Implements TMF681 Communication Management API v4.0.0
  - Passes Conformance Test Kit (CTK) validation

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB 5.0+
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install