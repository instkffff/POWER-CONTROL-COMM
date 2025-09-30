# Power Control Communication System

## Project Overview

This is a Node.js-based communication system designed for power control management. The system facilitates communication with power devices through serial ports (RS485) and provides both HTTP and WebSocket interfaces for client interaction.

The system allows clients to:

- Authenticate via HTTP login endpoint
- Connect via WebSocket for real-time communication
- Send commands to control power devices
- Receive updates about device status and power consumption

## Architecture

The system consists of several interconnected components:

1. **HTTP Server**: Manages user authentication and provides REST-like endpoints
2. **WebSocket Server**: Enables real-time bidirectional communication with clients
3. **Serial Communication Module**: Handles communication with hardware devices via RS485 serial ports
4. **Cron Scheduler**: Periodically polls device status and power consumption data
5. **Database**: Stores device information and measurements
6. **Packet Handling**: Converts between protocol formats and data structures

## Key Components

### Main Entry Point

`index.js` - The main application file that initializes all services:

- HTTP server on port 3000
- WebSocket server on port 3001
- Serial service initialization
- Cron scheduler startup

### HTTP Server

Located in `Http/main.js`:

- Provides `/api/login` endpoint for user authentication
- Uses `userList.json` for user credentials and `token.json` for session management
- Implements token-based authentication with expiration (24 hours)

### WebSocket Server

Located in `Websocket/main.js`:

- Provides WebSocket communication on port 3001
- Validates connections using token authentication
- Routes messages based on type:
  - Query requests handled by `query.js`
  - Command requests handled by `missionList.js`

### Serial Communication

Located in `Serial/main.js`:

- Manages communication with power devices via RS485 serial port (COM7 by default)
- Implements task queuing system for handling device commands
- Supports cancellation of ongoing operations
- Uses `SerialPort.js` for low-level serial communication

### Cron Scheduler

Located in `Crontab/CronMission.js`:

- Periodically polls all registered devices for status information
- Reads power consumption (KWH) and device status
- Updates database with collected information every hour
- Handles serial port connection management and error recovery

### Packet Handling

Located in `packetMaker/main.js`:

- Creates and parses protocol packets for device communication
- Uses function codes for different types of requests:
  - Function code 2: Read KWH data
  - Function code 7: Read device status
- Uses `FCmap` function mapping for different packet types

### Database

Located in `Database/main.js`:

- Manages SQLite database operations
- Updates device status and power consumption readings
- Provides methods for updating various device properties
- Contains separate modules for query and update operations

## Configuration Files

- `config.js`: System configuration including COM port, test mode settings
- `missionList.json`: List of available missions/commands (currently empty)
- `userList.json`: User authentication data
- `token.json`: Active user sessions and tokens
- `package.json`: Project dependencies and metadata

## Dependencies

- `better-sqlite3`: SQLite database driver
- `serialport`: Serial port communication
- `ws`: WebSocket implementation

## Building and Running

### Prerequisites

- Node.js (version supporting ES modules)
- RS485 serial port adapter connected to configured COM port
- Power devices compatible with the protocol

### Setup

Install dependencies:

   ```bash
   npm install
   ```

### Running

Start the application:

```bash
node index.js
```

The system will start:

- HTTP server on port 3000
- WebSocket server on port 3001
- Serial communication service on configured COM port
- Cron scheduler that runs every hour

## Development Conventions

- Uses ES modules (import/export syntax)
- Implements error handling with try/catch blocks
- Follows event-driven architecture with custom events
- Uses proper resource cleanup (closing serial ports)
- Implements graceful error handling for network and serial communications

## Testing

Currently, no formal tests are implemented. Tests could be added for:

- Authentication flows
- WebSocket message handling
- Serial communication protocols
- Database update operations

## System Flow

1. Users authenticate via HTTP login endpoint to get a token
2. Clients connect to WebSocket using the token for real-time communication
3. Commands are sent through WebSocket to control devices
4. The system manages a serial communication queue to handle device commands
5. A cron job periodically polls all devices for status and power consumption
6. All data is stored in an SQLite database
7. Packet handling converts between protocol formats and data structures

## API Documentation

### Authentication

- Endpoint: `/api/login`
- Method: POST
- Request Body:
  ```json
  {
    "number": "15012345678",
    "password": "123456"
  }
  ```
- Response:
  ```json
  {
    "code": 0,
    "name": "张三",
    "token": "hk9cemnlgbut86vgqjtb9"
  }
  ```

### WebSocket Connection

- URL: `ws://localhost:3001?token=hk9cemnlgbut86vgqjtb9`
- Connection Success Response:
  ```json
  {
    "type": "connection",
    "status": "success",
    "message": "连接已建立。"
  }
  ```

### WebSocket Commands

#### Command Requests

- Type: `command`
- Request Format:
  ```json
  {
    "type": "command",
    "requestID": "12345",
    "data": {
      "IDList": [801001, 801002],
      "FunctionCode": 11,
      "data": {
        "totalPower": 1000.0,
        "reactivePower": 400.0,
        "activePower": 990.0,
        "inductorPower": 990.0,
        "delay1": 60,
        "delay2": 60,
        "delay3": 60,
        "retry": 4
      }
    }
  }
  ```

#### Query Requests

- Types: `status`, `basicSetting`, `readKWHR`, `schedule`, `windowSetting`
- Request Format:
  ```json
  {
    "type": "status",
    "requestID": "12345",
    "data": {
      "deviceIDList": [801001, 801002],
      "levelList": [1],
      "groupList": [1],
      "roomIDList": []
    }
  }
  ```