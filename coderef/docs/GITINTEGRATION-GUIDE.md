# Git Integration Panel - User Guide

> A dummies guide to Scriptboard's Git Integration tool.

---

## What It Does

The Git Integration Panel lets you manage any git repository directly from Scriptboard:
- Select any git repo on your computer
- View and switch branches
- Create and delete branches
- Commit changes
- Pull from and push to remote

---

## Getting Started

### 1. Select a Repository

Click **Browse** next to the Repository field and navigate to any folder containing a `.git` directory. Your selection is saved and will persist across sessions.

### 2. View Status

Once selected, you'll see:
- **Current branch** (e.g., `main`, `feature/my-branch`)
- **Status badge** - Green "Clean" or Yellow "Modified"
- **Untracked files count** - Files not yet tracked by git

---

## Features

### Branch Management

| Action | How To |
|--------|--------|
| **Switch branch** | Click branch dropdown, select branch |
| **Create branch** | Click "New Branch" in dropdown, enter name |
| **Delete branch** | Hover over branch, click trash icon |

*Note: Cannot delete the currently checked-out branch.*

### Remote Operations

| Button | What It Does |
|--------|--------------|
| **Pull** | Fetch and merge changes from remote |
| **Push** | Upload local commits to remote |

### Committing Changes

When you have uncommitted changes (yellow "Modified" badge):
1. Enter a commit message in the text field
2. Click **Commit All Changes**
3. This stages all files and creates a commit

---

## UI Elements

```
+------------------------------------------+
| Git Integration                    [↻]   |
+------------------------------------------+
| Repository                               |
| [ C:\path\to\repo           ] [Browse]   |
|                                          |
| [main ▼]  [Modified]  +3 untracked      |
|                                          |
| [Pull]  [Push]                           |
|                                          |
| -------- Commit Section ---------        |
| [ Commit message...                    ] |
| [       Commit All Changes             ] |
+------------------------------------------+
```

### Status Badges

| Badge | Meaning |
|-------|---------|
| **Clean** (green) | No uncommitted changes |
| **Modified** (yellow) | Has uncommitted changes |
| **+N untracked** | N files not tracked by git |

---

## Branch Dropdown

```
+------------------+
| + New Branch     |
|------------------|
| ✓ main           |  <- Current branch (checked)
|   feature/auth   |  [🗑]  <- Delete on hover
|   bugfix/typo    |  [🗑]
+------------------+
```

---

## Common Workflows

### Start a New Feature

1. Click branch dropdown
2. Click "New Branch"
3. Enter name (e.g., `feature/my-feature`)
4. Press Enter - automatically switches to new branch

### Commit and Push Changes

1. Make your code changes
2. Enter commit message
3. Click "Commit All Changes"
4. Click "Push" to upload to remote

### Pull Latest Changes

1. Click "Pull" to fetch and merge remote changes
2. Resolve any conflicts if they occur

### Clean Up Old Branch

1. Switch to a different branch first
2. Open branch dropdown
3. Hover over branch to delete
4. Click trash icon
5. Confirm deletion

---

## Error Handling

| Error | Solution |
|-------|----------|
| "Not a git repository" | Selected folder doesn't have `.git` |
| "Checkout failed" | Commit or stash changes first |
| "Push failed" | Pull first to sync with remote |
| "Delete failed" | Cannot delete current branch |

Errors appear in a red banner with an X button to dismiss.

---

## Storage

- **Repo path**: Saved to localStorage (`scriptboard_git_repo_path`)
- Persists across browser sessions and app restarts

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /git/status?path=` | Fetch repo status |
| `GET /git/branches?path=` | List branches |
| `POST /git/branches` | Create branch |
| `POST /git/checkout` | Switch branch |
| `DELETE /git/branches/{name}` | Delete branch |
| `POST /git/commit` | Commit changes |
| `POST /git/pull` | Pull from remote |
| `POST /git/push` | Push to remote |

---

## Tips

- **Refresh**: Click the ↻ button to manually refresh status
- **Keyboard shortcut**: Press Enter in commit message field to commit
- **Quick branch create**: Enter name and press Enter

---

## Component Location

- **Panel**: `frontend/src/components/GitIntegrationPanel.tsx`
- **Folder Picker**: `frontend/src/components/filemanager/FolderPicker.tsx`
- **API Functions**: `frontend/src/lib/api.ts`

---

*Part of Scriptboard - Workorder WO-GIT-001*
