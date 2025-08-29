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
- Manages communication with power devices via RS485 serial port (COM5)
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

### Database
Located in `Database/main.js`:
- Manages SQLite database operations
- Updates device status and power consumption readings
- Provides methods for updating various device properties

## Configuration Files

- `deviceConfig.json`: Device configuration settings
- `missionList.json`: List of available missions/commands
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
- RS485 serial port adapter connected to COM5
- Power devices compatible with the protocol

### Setup
1. Install dependencies:
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
- Serial communication service on COM5
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