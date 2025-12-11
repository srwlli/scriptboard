# Task: Migrate PromptingWorkflowStandalone to Sonner Notifications

## Install
```bash
npm install sonner
```

## Setup
Add `<Toaster />` to `frontend/src/app/layout.tsx`:
```tsx
import { Toaster } from "sonner";

// Inside the body, add:
<Toaster position="bottom-right" richColors />
```

## File to Modify
`frontend/src/components/PromptingWorkflowStandalone.tsx`

## Changes
1. Add import:
```tsx
import { toast } from "sonner";
```

2. Replace all `alert()` calls:
- Success messages → `toast.success("message")`
- Error messages → `toast.error("message")`
- Info messages → `toast.info("message")`

3. Keep `confirm()` dialogs as-is (for destructive actions like "Clear all?")

## Examples
```tsx
// Before
alert("Clipboard empty");
alert("Copied to clipboard: prompt + 2 files");
alert("Failed to load prompt file");

// After
toast.error("Clipboard empty");
toast.success("Copied to clipboard: prompt + 2 files");
toast.error("Failed to load prompt file");
```

## Notes
- There are ~15-20 alert calls to replace
- Search for `alert(` in the file to find all instances
- Do NOT modify the modals (showPromptViewModal, etc.) - those stay as-is
