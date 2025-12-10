# Function Mapping: scriptboard.py → Next.js React Components

This document maps all functions from the original scriptboard.py to React handlers and API calls.

## Favorites Section

| Original Function | React Handler | Implementation |
|------------------|---------------|----------------|
| `add_favorite()` | `handleAddFavorite` | Electron: `selectFolder()` IPC → API: Update config favorites |
| `open_favorite(path)` | `handleOpenFavorite` | Electron: `openFolder(path)` IPC or API: `GET /favorites/{id}` |
| `remove_favorite(index)` | `handleRemoveFavorite` | API: `DELETE /config/favorites/{id}` or update config |

## Prompt Section

| Original Function | React Handler | Implementation |
|------------------|---------------|----------------|
| `load_prompt()` | `handleLoadPrompt` | Electron: `openFileDialog()` IPC → API: `POST /prompt/load` with filepath |
| `set_prompt()` | `handleSetPrompt` | Browser: `navigator.clipboard.readText()` → API: `POST /prompt` |
| `view_prompt()` | `handleViewPrompt` | Modal/Window: Display prompt content (use existing PreviewPanel or create modal) |
| `clear_prompt()` | `handleClearPrompt` | API: `DELETE /prompt` |

## Attachments Section

| Original Function | React Handler | Implementation |
|------------------|---------------|----------------|
| `attach_file()` | `handleAttachFile` | Electron: `openFileDialog()` IPC → API: `POST /attachments` with file |
| `paste_code()` | `handlePasteCode` | Browser: `navigator.clipboard.readText()` → API: `POST /attachments/text` |
| `view_attachments()` | `handleViewAttachments` | Modal/Window: Display attachment list (use existing AttachmentsPanel or create modal) |
| `clear_attachments()` | `handleClearAttachments` | API: `DELETE /attachments` |

## Responses Section

| Original Function | React Handler | Implementation |
|------------------|---------------|----------------|
| `open_all_llms()` | `handleOpenAllLLMs` | Browser: `window.open()` for each LLM URL from config (API: `GET /config` → `llm_urls`) |
| `paste()` | `handlePaste` | Browser: `navigator.clipboard.readText()` → API: `POST /responses` with source="Clipboard" |
| `view_responses()` | `handleViewResponses` | Modal/Window: Display response list (use existing ResponsesPanel or create modal) |
| `clear()` | `handleClearResponses` | API: `DELETE /responses` |

## Management Section

| Original Function | React Handler | Implementation |
|------------------|---------------|----------------|
| `copy_all()` | `handleCopyAll` | API: `GET /export/json` → Browser: `navigator.clipboard.writeText()` |
| `save_clipboard_to_dir()` | `handleSaveClipboardToDir` | Browser: `navigator.clipboard.readText()` → Electron: `selectFolder()` IPC → Write file via API or Electron |
| `view_combined_preview()` | `handleViewCombinedPreview` | Modal/Window: Display combined preview (use existing PreviewPanel or create modal) |
| `clear()` | `handleClearAll` | API: `DELETE /prompt`, `DELETE /attachments`, `DELETE /responses` (sequential) |

## Preview Panel

| Original Function | React Handler | Implementation |
|------------------|---------------|----------------|
| `toggle_view()` | `handleTogglePreview` | React state: `setPreviewVisible(!previewVisible)` |

## Footer/Status Bar

| Original Function | React Handler | Implementation |
|------------------|---------------|----------------|
| `show_status(message, timeout_ms)` | `setStatusMessage` | React state: `setStatusMessage(message)`, clear after timeout |
| `_on_lock_size_toggle()` | `handleLockSizeToggle` | React state: `setLockSize(!lockSize)` → Apply CSS `max-width` to container |
| `_on_topmost_toggle()` | `handleOnTopToggle` | React state: `setOnTop(!onTop)` → Apply CSS `position: sticky` or `fixed` |
| `_update_size_visibility()` | `handleSizeVisibility` | React state: `setShowSize(!showSize)` → Conditionally render size label |
| `_update_window_size_label()` | `useEffect` hook | React: `useEffect` with `window.innerWidth/innerHeight` → Update size label |

## Button Layout Pattern

All sections follow this pattern:
- **Button Row**: Centered horizontal row of buttons
- **Primary Button**: Leftmost, green background (`BUTTON_PRIMARY`)
- **Secondary Buttons**: Right side, gray background (`BUTTON_BG`)
- **Status Label**: Below buttons, shows current state

### Button Config Structure

```typescript
interface ButtonConfig {
  text: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}
```

## Status Label Pattern

All sections have a status label showing:
- **Prompt**: "No prompt" or "[Source]" or "Prompt Accepted: N"
- **Attachments**: "No attachments" or "📎 {names} ({total_lines} lines)"
- **Responses**: "Responses: 0 | Characters: 0"
- **Management**: "Prompts: 0 | Attachments: 0 | Responses: 0"

## API Endpoints Reference

All API calls use the existing `api.ts` client:

- `api.setPrompt(text)` - POST /prompt
- `api.clearPrompt()` - DELETE /prompt
- `api.loadPrompt(filepath)` - POST /prompt/load (if exists, or use file dialog → setPrompt)
- `api.addAttachmentText(text)` - POST /attachments/text
- `api.addAttachment(file)` - POST /attachments (with file)
- `api.clearAttachments()` - DELETE /attachments
- `api.listAttachments()` - GET /attachments
- `api.addResponse(source, content)` - POST /responses
- `api.clearResponses()` - DELETE /responses
- `api.getSession()` - GET /session
- `api.getPreview()` - GET /preview
- `api.exportMarkdown()` - GET /export/markdown (or similar)

## Electron IPC APIs

- `window.electronAPI.openFileDialog()` - File picker
- `window.electronAPI.selectFolder()` - Folder picker
- `window.electronAPI.openFolder(path)` - Open folder in explorer

