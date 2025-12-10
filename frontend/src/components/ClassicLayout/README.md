# Classic Layout Components

Section components for the classic scriptboard.py UI/UX layout. These components replicate the original Tkinter application's vertical stack layout with button rows and status labels.

## Components

### FavoritesSection

Horizontal row of favorite buttons with Add+ button.

**Features:**
- Add+ button (primary, leftmost)
- Favorite buttons (secondary, horizontal row)
- Right-click to remove favorite
- Opens folders in system file explorer (Electron only)

### PromptSection

Prompt management section with Load, Paste, View, Clear buttons.

**Features:**
- Load: Open file dialog to load prompt from JSON file
- Paste: Paste prompt from clipboard
- View: Display prompt in modal
- Clear: Clear current prompt
- Status label showing prompt source or "No prompt"

### AttachmentsSection

Attachment management section with Load, Paste, View, Clear buttons.

**Features:**
- Load: Open file dialog to attach file
- Paste: Paste code/text as attachment
- View: Display attachment list in modal
- Clear: Clear all attachments
- Status label showing attachment count and total lines

### ResponsesSection

Response management section with LLMs, Paste, View, Clear buttons.

**Features:**
- LLMs: Open all configured LLM URLs in new windows
- Paste: Paste response from clipboard
- View: Display responses in modal
- Clear: Clear all responses
- Status label showing response count and character total

### ManagementSection

Session management section with Copy All, Save As, View, Clear All buttons.

**Features:**
- Copy All: Copy entire session as JSON to clipboard
- Save As: Save clipboard content to file
- View: Display combined preview in modal
- Clear All: Clear prompt, attachments, and responses
- Status label showing counts for prompts, attachments, and responses

### ToggleablePreview

Toggleable preview panel component.

**Props:**
- `visible: boolean` - Whether preview is visible
- `onToggle: () => void` - Toggle visibility handler

**Features:**
- Uses existing PreviewPanel component for content
- Can be shown/hidden via toggle
- Matches original scriptboard.py preview behavior

## Usage

All components are used in the `/new-page` route:

```tsx
import { FavoritesSection } from "@/components/ClassicLayout/FavoritesSection";
import { PromptSection } from "@/components/ClassicLayout/PromptSection";
// ... etc
```

## Function Mapping

All functions are mapped to API calls or Electron IPC as documented in `coderef/working/new-page/FUNCTION_MAPPING.md`.

## Styling

All sections use the classic layout styling:
- Background: `#010409`
- Padding: `px-5 py-2` or `px-5 py-4` for favorites
- Button styling matches original scriptboard.py
- Status labels use panel background `#0d1117`

