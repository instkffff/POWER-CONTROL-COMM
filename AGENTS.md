# AGENTS.md

## Build/Lint/Test Commands

```bash
# Run tests (no specific test runner configured)
npm test

# No specific linting configured
# No specific build process configured

# Run a single test file directly with Node.js
node path/to/test/file.js
```

## Code Style Guidelines

### Imports
- Use ES6 modules with `import`/`export` syntax
- Use relative paths for local modules
- Group imports in the following order:
  1. Built-in Node.js modules
  2. External packages
  3. Local modules

### Formatting
- Use 2-space indentation
- No trailing whitespace
- Line length should be reasonable (not strictly enforced)
- Use single quotes for strings where possible

### Types
- Use JSDoc comments for function parameters and return types
- Buffer is commonly used for binary data operations
- Numbers are used for most numeric values
- Objects are used for structured data

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes (if any)
- Use UPPER_CASE for constants
- Use descriptive names for variables and functions

### Error Handling
- Use try/catch blocks for error handling
- Log errors with meaningful messages
- Throw errors with descriptive messages when appropriate
- Use console.error for error output

### Additional Notes
- The project uses better-sqlite3 for database operations
- Serial port communication is handled with the serialport package
- WebSocket communication uses the ws package
- Packet generation and parsing is a core functionality
- Test mode can be enabled in config.js