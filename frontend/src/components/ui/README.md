# UI Components

Reusable UI components for the classic layout. These components match the original scriptboard.py styling and can be imported and used anywhere in the application.

## Components

### SectionButtonRow

Centered horizontal row of buttons matching the original scriptboard.py layout.

**Props:**
- `buttons: ButtonConfig[]` - Array of button configurations
- `className?: string` - Optional additional CSS classes

**ButtonConfig:**
```typescript
interface ButtonConfig {
  text: string;
  onClick: () => void;
  variant: "primary" | "secondary";
  disabled?: boolean;
}
```

**Example:**
```tsx
import { SectionButtonRow } from "@/components/ui";

<SectionButtonRow
  buttons={[
    { text: "Load", onClick: handleLoad, variant: "primary" },
    { text: "Paste", onClick: handlePaste, variant: "secondary" },
  ]}
/>
```

### StatusLabel

Status text display component with panel-style background.

**Props:**
- `text: string` - Status text to display
- `className?: string` - Optional additional CSS classes

**Example:**
```tsx
import { StatusLabel } from "@/components/ui";

<StatusLabel text="No prompt" />
<StatusLabel text="Responses: 5 | Characters: 1,234" />
```

### SectionDivider

Horizontal divider line between sections.

**Props:**
- `className?: string` - Optional additional CSS classes

**Example:**
```tsx
import { SectionDivider } from "@/components/ui";

<SectionDivider />
```

### FooterBar

Footer/status bar component with status message, character count, size display, and control checkboxes.

**Props:**
- `statusMessage?: string` - Status message to display (left side)
- `charCount?: number` - Character count to display
- `showSize?: boolean` - Whether to show window size
- `lockSize?: boolean` - Lock size checkbox state
- `onTop?: boolean` - On top checkbox state
- `onLockSizeChange?: (locked: boolean) => void` - Lock size change handler
- `onOnTopChange?: (onTop: boolean) => void` - On top change handler
- `className?: string` - Optional additional CSS classes

**Example:**
```tsx
import { FooterBar } from "@/components/ui";

<FooterBar
  statusMessage="Ready"
  charCount={1234}
  showSize={true}
  lockSize={false}
  onTop={false}
  onLockSizeChange={(locked) => setLockSize(locked)}
  onOnTopChange={(onTop) => setOnTop(onTop)}
/>
```

## Styling

All components use the original scriptboard.py color scheme:
- Background: `#010409`
- Panel: `#0d1117`
- Border: `#21262d`
- Text: `#c9d1d9`
- Muted: `#8b949e`
- Primary Button: `#1a7f37` (green)
- Secondary Button: `#161b22` (gray)

## Usage

All components can be imported from the main export:

```tsx
import { SectionButtonRow, StatusLabel, SectionDivider, FooterBar } from "@/components/ui";
```

