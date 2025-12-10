# Scriptboard

Modern workspace for managing LLM prompts, attachments, and responses. Migrated from Tkinter to a modern architecture with Python Core, FastAPI Backend, Next.js Frontend, and Electron Shell.

> 📝 See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## Features

- **Prompt Management**: Load prompts from files, paste from clipboard, use preloaded prompts
- **Attachment Handling**: Attach files or paste text snippets, view attachment lists
- **Response Collection**: Collect and manage LLM responses
- **Unified Preview**: Combined preview of all content
- **Session Management**: Save and load sessions with autosave
- **Search**: Search across prompts, attachments, and responses
- **Token Counting**: Estimate tokens using tiktoken
- **Theme System**: Light/dark theme with persistence
- **Keyboard Shortcuts**: Configurable keyboard shortcuts

## Architecture

- **Python Core** (`backend/core.py`): Pure business logic, no I/O
- **FastAPI Backend** (`backend/api.py`): HTTP API layer with validation
- **Next.js Frontend** (`frontend/`): React UI with TypeScript
- **Electron Shell** (`shell/`): Desktop integration

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Electron Shell Setup

```bash
cd shell
npm install
```

## Running

### Quick Start (Desktop App)

**Easiest way - use the desktop shortcut:**
- Double-click the `Scriptboard` shortcut on your desktop
- Or run: `shell\start-scriptboard.bat`

This automatically starts the backend, frontend, and opens the Electron window.

### Development Mode (Manual)

1. **Start Backend**:
   ```bash
   cd backend
   venv\Scripts\activate  # or source venv/bin/activate on Linux/Mac
   uvicorn api:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Start Electron** (optional, for desktop app):
   ```bash
   cd shell
   npm run dev
   ```

### Desktop App Installation

To install Scriptboard as a desktop app, see [INSTALL.md](INSTALL.md) for detailed instructions.

**Quick development mode:**
```bash
cd shell
npm install
npm run dev
```

**Build installer:**
```bash
# Build frontend first
cd frontend
npm run build

# Then package
cd ../shell
npm install  # Installs electron-builder
npm run package:win  # or package:mac, package:linux
```

The installer will be created in `shell/dist/`.

## Configuration

Configuration is stored in `~/.scriptboard/config.json`. The file is created automatically on first run with defaults.

## API Documentation

When the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Project Structure

```
.
├── backend/          # Python backend
│   ├── core.py      # Business logic
│   ├── api.py       # FastAPI application
│   ├── schemas.py   # Pydantic models
│   ├── settings.py  # Default configuration
│   └── tests/       # Unit tests
├── frontend/        # Next.js frontend
│   ├── app/         # Next.js app router
│   └── src/
│       ├── components/  # React components
│       └── lib/         # Utilities
└── shell/           # Electron shell
    ├── main.js      # Main process
    └── preload.js   # Preload script
```

## License

ISC

