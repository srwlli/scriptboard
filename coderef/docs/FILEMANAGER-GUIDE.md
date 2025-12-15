# File Manager - Complete Guide

> A beginner-friendly guide to organizing, renaming, and cleaning up your files.

---

## What is File Manager?

File Manager is your personal file organization assistant. It helps you:
- Sort messy folders into organized categories
- Rename hundreds of files at once
- Find and delete old or large files
- Create a searchable catalog of your files
- Find duplicate files wasting space
- Undo mistakes if something goes wrong

**Think of it like this:** Imagine hiring someone to clean up your messy downloads folder, rename all your vacation photos, and find files you forgot about. That's what File Manager does, but instantly.

---

## The Golden Rule: Preview Before Apply

Every action in File Manager follows the same safe pattern:

1. **Set your options** - Tell it what you want to do
2. **Click Preview** - See exactly what will happen (nothing changes yet!)
3. **Review the list** - Make sure it looks right
4. **Click Apply** - Only now do the changes happen

This means you can experiment freely. Nothing happens until you click Apply.

---

## The 6 Tabs

File Manager has 6 tabs, each for a different task:

| Tab | Icon | What It Does |
|-----|------|--------------|
| **Organize** | Folder tree | Sort files into folders by type or date |
| **Rename** | Text cursor | Rename multiple files at once |
| **Clean** | Trash can | Delete old or large files |
| **Index** | Magnifying glass | Create a catalog of all your files |
| **Dupes** | Copy icon | Find duplicate files |
| **Undo** | Undo arrow | Reverse previous operations |

---

## Organize Tab

Automatically sort files into folders based on their type or when they were created.

### Organize By Options

| Option | What It Creates | Example |
|--------|-----------------|---------|
| **File Extension** | Folders named by file type | `pdf/`, `jpg/`, `docx/` |
| **Date** | Folders by exact date | `2024-12-15/`, `2024-12-14/` |
| **Month** | Folders by year-month | `2024-12/`, `2024-11/` |

### Settings Explained

- **Path** - The folder you want to organize (e.g., `C:\Users\You\Downloads`)
- **Recursive** - Check this to include subfolders too
- **Exclude Patterns** - Folders/files to skip (e.g., `node_modules,.git`)
- **Remove Empty Folders** - Delete folders that become empty after organizing

### Example: Cleaning Up Downloads

1. Enter path: `C:\Users\YourName\Downloads`
2. Set "Organize By" to "File Extension"
3. Check "Recursive"
4. Click **Preview**
5. You'll see: `report.pdf` → `pdf/report.pdf`
6. If it looks good, click **Apply**

Your messy downloads folder now has neat subfolders!

---

## Rename Tab

Rename many files at once using patterns, prefixes, suffixes, or numbering.

### Rename Options

| Option | What It Does | Example |
|--------|--------------|---------|
| **Pattern (Regex)** | Find text to replace | `IMG_\d+` finds `IMG_1234` |
| **Replace With** | What to replace it with | `photo` makes `photo.jpg` |
| **Prefix** | Add text to the start | `vacation_` → `vacation_photo.jpg` |
| **Suffix** | Add text before extension | `_2024` → `photo_2024.jpg` |
| **Add Numbers** | Number files sequentially | `001`, `002`, `003`... |
| **Lowercase** | Make filename lowercase | `PHOTO.JPG` → `photo.jpg` |
| **Uppercase** | Make filename uppercase | `photo.jpg` → `PHOTO.JPG` |
| **Sanitize** | Remove special characters | `photo (1).jpg` → `photo_1.jpg` |
| **Extension Filter** | Only rename certain types | `jpg` only renames JPGs |

### Number Formatting

When "Add Numbers" is checked:
- **Start** - First number (e.g., 1)
- **Width** - Digits to use (3 = `001`, `002`)

### Example: Renaming Vacation Photos

Want to rename `IMG_4521.jpg`, `IMG_4522.jpg` to `hawaii_001.jpg`, `hawaii_002.jpg`?

1. Enter path: `C:\Users\YourName\Pictures\Vacation`
2. Set Pattern: `IMG_\d+` (matches IMG_ followed by numbers)
3. Set Replace: `hawaii`
4. Check "Add Numbers", Start: 1, Width: 3
5. Set Extension Filter: `jpg`
6. Click **Preview**
7. Review the changes, then **Apply**

---

## Clean Tab

Find and remove old or large files that are wasting space.

### Filter Options

| Filter | What It Finds |
|--------|---------------|
| **Older Than X Days** | Files not modified in X days |
| **Larger Than X MB** | Files bigger than X megabytes |

You can use one or both filters. Files must match ALL active filters.

### Delete Modes

| Mode | What Happens | Can Undo? |
|------|--------------|-----------|
| **Move to Recycle Bin** | Files go to trash | Yes - restore from Recycle Bin |
| **Delete Permanently** | Files are gone forever | NO - cannot be recovered |
| **Archive To** | Files move to specified folder | Yes - they're just moved |

### Example: Cleaning Temp Files

1. Enter path: `C:\Users\YourName\AppData\Local\Temp`
2. Set "Older Than": 30 days
3. Select "Move to Recycle Bin" (safest!)
4. Click **Preview**
5. Review what will be deleted
6. Click **Move to Trash**

**Warning:** Always preview first! Make sure you're not deleting something important.

---

## Index Tab

Create a searchable catalog of all files in a folder. Useful for large file collections.

### What It Does

Scans a folder and creates a record of:
- Every file's name and path
- File size
- Last modified date

### Why Use It?

- Know what you have without browsing
- Search across thousands of files
- Find files you forgot about
- Track what's in external drives

### How to Use

1. Enter the path to scan
2. Click **Start Index** (this may take a while for large folders)
3. Watch the progress indicator
4. When done, you'll have a searchable file list

**Note:** Indexing doesn't change your files. It just reads them.

---

## Dupes Tab

Find duplicate files that are wasting disk space.

### How It Works

1. Scans files in the folder
2. Compares file contents (not just names)
3. Groups identical files together
4. You choose which copies to delete

### What Makes Files Duplicates?

Two files are duplicates if they have **identical content**, even if:
- They have different names
- They're in different folders
- They have different dates

### How to Use

1. Enter the path to scan
2. Click **Find Duplicates**
3. Wait for the scan (can take a while for many files)
4. Review the groups of duplicates
5. Select which copies to remove
6. Click **Apply** to delete selected files

**Tip:** Keep the file in the most logical location and delete the copies.

---

## Undo Tab

Made a mistake? The Undo tab shows your operation history and lets you reverse changes.

### What It Shows

- List of recent file operations
- When they happened
- How many files were affected
- Status (success, failed, undone)

### How to Undo

1. Click the **Undo** tab
2. Find the operation you want to reverse
3. Click the **Undo** button next to it
4. Confirm the undo

### What Can Be Undone?

| Operation | Can Undo? | Notes |
|-----------|-----------|-------|
| Organize | Yes | Files move back to original location |
| Rename | Yes | Files get their old names back |
| Clean (to trash) | Yes | Files restore from operation history |
| Clean (permanent) | **No** | Cannot recover permanently deleted files |
| Archive | Yes | Files move back from archive |

### Important Notes

- Undo works best immediately after an operation
- If you've made more changes to files, undo may not work
- Permanently deleted files cannot be recovered

---

## Common Settings Across All Tabs

These options appear in multiple tabs:

### Path
The folder to work with. Click the folder icon to browse, or type/paste a path.

### Recursive
When checked, includes all subfolders. When unchecked, only looks at files directly in the folder.

### Exclude Patterns
Skip certain folders or files. Separate with commas.

Common patterns:
- `node_modules` - Skip JavaScript dependencies
- `.git` - Skip Git repositories
- `*.tmp` - Skip temporary files
- `$RECYCLE.BIN` - Skip Recycle Bin

---

## Tips & Tricks

### Organizing Downloads

1. Go to **Organize** tab
2. Path: Your Downloads folder
3. Organize by: File Extension
4. Preview, then Apply
5. Now you have `pdf/`, `jpg/`, `exe/` etc.

### Batch Renaming Photos

1. Go to **Rename** tab
2. Use Pattern/Replace for camera names (IMG_, DSC_, etc.)
3. Add a descriptive prefix
4. Enable numbering
5. Filter by `jpg` or `png`

### Finding Space Hogs

1. Go to **Clean** tab
2. Leave "Older Than" empty
3. Set "Larger Than": 100 MB
4. Preview to see your biggest files
5. Decide what to delete

### Cleaning Old Temp Files

1. Go to **Clean** tab
2. Path: Temp folder
3. Set "Older Than": 7 days
4. Use "Move to Recycle Bin"
5. Preview and Apply

### Preventing Mistakes

- **Always preview first** - Never skip this step
- **Start with Recycle Bin** - Don't permanently delete until you're sure
- **Check the Undo tab** - Know you can reverse operations
- **Test on a small folder first** - Before running on important files

---

## Understanding the Preview Table

When you click Preview, you see a table showing what will happen:

| Column | What It Shows |
|--------|---------------|
| **Action** | What will happen (move, rename, delete) |
| **Source** | Original file location/name |
| **Destination** | New location/name (if applicable) |
| **Status** | Pending, Done, Error |

Review this carefully before clicking Apply!

---

## Error Messages

### "Please enter a folder path"
You need to specify which folder to work with. Type a path or use the folder picker.

### "No files found to organize"
The folder is empty or all files are already organized. Nothing to do!

### "No files match the specified criteria"
Your filters are too strict. Try reducing the "Older Than" days or "Larger Than" MB.

### "Access denied"
The app can't access that folder. Try:
- Running as administrator
- Choosing a folder you have permission to access
- Making sure the folder isn't in use by another program

---

## Technical Reference

For developers who want to understand the code:

**Main Component:** `FileManager.tsx`
**Panel Components:**
- `filemanager/OrganizePanel.tsx`
- `filemanager/RenamePanel.tsx`
- `filemanager/CleanPanel.tsx`
- `filemanager/IndexPanel.tsx`
- `filemanager/DupesPanel.tsx`
- `filemanager/UndoPanel.tsx`

**Shared Components:**
- `filemanager/ActionPreviewTable.tsx` - The preview table
- `filemanager/FolderPicker.tsx` - Folder selection
- `filemanager/ProgressIndicator.tsx` - Progress display

**Backend Endpoints:**
- `POST /fileman/organize` - Organize files
- `POST /fileman/rename` - Rename files
- `POST /fileman/clean` - Clean/delete files
- `POST /fileman/index` - Index files (SSE streaming)
- `POST /fileman/dupes` - Find duplicates (SSE streaming)
- `GET /fileman/history` - Get operation history
- `POST /fileman/undo` - Undo an operation

---

*Last updated: December 2024*
