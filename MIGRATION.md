# Migration Guide: Tkinter Scriptboard to Modern Architecture

This guide helps users migrate from the original Tkinter-based Scriptboard to the new modern architecture.

## What Changed

### Architecture
- **Before**: Single Tkinter application with embedded logic
- **After**: Separated layers (Core, API, Frontend, Shell)

### File Structure
- **Before**: Single `scriptboard.py` file
- **After**: Modular structure with `backend/`, `frontend/`, `shell/`

### Data Storage
- **Before**: Sessions stored in application directory
- **After**: Sessions stored in `~/.scriptboard/sessions/`

### Configuration
- **Before**: Hardcoded or minimal config
- **After**: JSON config file at `~/.scriptboard/config.json`

## Feature Parity

All original features are preserved:

✅ Prompt management (load, paste, preloaded prompts)  
✅ Attachment handling (files, clipboard)  
✅ Response collection  
✅ Preview panel  
✅ Session save/load  
✅ Favorites  

## New Features

The new version adds:

- **Search**: Search across all content
- **Token counting**: Estimate tokens for LLM usage
- **Theme system**: Light/dark mode
- **Keyboard shortcuts**: Configurable hotkeys
- **Profiles**: Workspace profiles for different configurations
- **Autosave**: Automatic session saving with recovery

## Migration Steps

### 1. Export Existing Sessions

If you have sessions in the old format, export them before migrating.

### 2. Install New Version

Follow the installation instructions in `README.md`.

### 3. Import Configuration

Create `~/.scriptboard/config.json` with your favorites and LLM URLs:

```json
{
  "favorites": [
    {"label": "My Project", "path": "/path/to/project"}
  ],
  "llm_urls": [
    {"label": "GPT", "url": "https://chat.openai.com"}
  ],
  "theme": "dark"
}
```

### 4. Import Sessions

Old session files may need conversion. The new format uses:
- `schema_version: "1.0"`
- Structured attachment/response objects
- Profile references

### 5. Verify Functionality

Test all workflows:
- Load prompt
- Add attachments
- Collect responses
- Save/load sessions
- Use search

## Breaking Changes

1. **Session Format**: New JSON schema (versioned for future compatibility)
2. **Config Location**: Moved to `~/.scriptboard/`
3. **File Paths**: Absolute paths may need updating
4. **Keyboard Shortcuts**: New keymap system (configurable)

## Rollback

If you need to use the old version:
1. Keep a backup of the old `scriptboard.py`
2. Old sessions may not be directly compatible
3. Export data before switching back

## Support

For issues or questions, check:
- `README.md` for setup
- `ARCHITECTURE.md` for technical details
- API docs at `http://localhost:8000/docs` when running

