# Changelog

All notable changes to the Scriptboard Application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-27

### Added - Initial Release

#### Core Architecture
- **Python Core Layer** (`backend/core.py`): Complete business logic implementation
  - Session management with JSON serialization
  - Attachment handling (files, clipboard, folder import)
  - Response collection and management
  - Search functionality with pagination
  - Token counting using `tiktoken` with caching
  - Autosave with debouncing and rotation
  - Profile management for workspace configurations

#### Backend API (`backend/api.py`)
- **FastAPI REST API** with comprehensive endpoints:
  - Session operations: create, load, save, list, delete, search
  - Attachment management: add, remove, list
  - Response collection: add, remove, list, get all
  - Preview generation with token counting
  - Batch processing queue with job management
  - Git integration: status check and commit sessions
  - Direct LLM API mode (basic structure)
  - Export to Markdown
  - Configuration and profile management
  - Keyboard shortcut management
- **Error Handling**: Standardized error envelope `{error: {code, message, details}}`
- **CORS Configuration**: Properly configured for frontend integration
- **Logging**: Structured logging with file rotation

#### Frontend (`frontend/`)
- **Next.js 16** application with TypeScript and Tailwind CSS
- **Theme System**: Global theme management with light/dark mode
- **Components**:
  - Header with search functionality
  - Favorites Panel with drag-and-drop support
  - Prompt Panel with preloaded prompts
  - Attachments Panel with file/clipboard/folder import
  - Responses Panel with diff viewer
  - Session Manager Panel
  - Preview Panel with token counting
  - Batch Queue Panel for job management
  - Logging Console Panel for real-time logs
  - Profile Selector for workspace profiles
  - Keymap Editor for keyboard shortcuts
  - Git Integration Panel
- **State Management**: React hooks with API integration
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Mobile-friendly layout

#### Electron Shell (`shell/`)
- **Desktop Application**: Electron wrapper for native desktop experience
- **IPC Communication**: Secure communication between renderer and main process
- **Backend Integration**: Automatic backend spawning and management
- **File System Access**: Folder dialogs and system file explorer integration
- **Production Build**: Electron Builder configuration for Windows, macOS, and Linux

#### Testing
- **Backend Unit Tests**: Comprehensive test coverage for core functionality
- **Frontend Component Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright for end-to-end testing
- **Performance Tests**: Response time benchmarks for key endpoints

#### Documentation
- **README.md**: Complete setup and usage instructions
- **ARCHITECTURE.md**: Technical architecture documentation
- **MIGRATION.md**: Migration guide from Tkinter version
- **INSTALL.md**: Detailed installation and packaging instructions

#### Developer Experience
- **Type Safety**: Full TypeScript coverage for frontend
- **Code Quality**: Linting and formatting configured
- **Development Scripts**: Easy start scripts for all components
- **Desktop Shortcut**: Batch file and PowerShell script for quick launch

### Technical Details

#### Dependencies
- **Backend**: FastAPI, Pydantic, uvicorn, tiktoken, python-multipart
- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS
- **Shell**: Electron, electron-builder
- **Testing**: pytest, Jest, React Testing Library, Playwright

#### Configuration
- User configuration: `~/.scriptboard/config.json`
- Session storage: `~/.scriptboard/sessions/`
- Log files: `~/.scriptboard/logs/`
- Profile storage: `~/.scriptboard/profiles/`

#### Features
- ✅ Session save/load with autosave
- ✅ Attachment handling (files, clipboard, folders)
- ✅ Response collection and comparison
- ✅ Search across all content
- ✅ Token counting for LLM usage estimation
- ✅ Theme system (light/dark)
- ✅ Keyboard shortcuts (configurable)
- ✅ Workspace profiles
- ✅ Batch processing queue
- ✅ Git integration
- ✅ Export to Markdown
- ✅ Real-time logging console
- ✅ Favorites management

### Migration Notes

This is a complete rewrite from the original Tkinter application. See `MIGRATION.md` for detailed migration instructions.

### Workorder

- **WO-SCRIPTBOARD-APP-001**: Complete Scriptboard Application implementation

---

## [Unreleased]

### Planned
- Keychain integration for Direct LLM API Mode
- PDF export functionality
- Advanced search filters
- Session templates
- Plugin system

