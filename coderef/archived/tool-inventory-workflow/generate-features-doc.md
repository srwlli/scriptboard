# Generate Features Inventory

You are creating a **USER-FACING reference guide** - documenting what users CAN DO with this app.

## Output: `coderef/user/features.md`

---

## Expected Format

```markdown
# {App Name} - Features

> Last updated: {YYYY-MM-DD}

## Overview
{One paragraph: What is this app? Who is it for? What problem does it solve?}

---

## What You Can Do

### {Category Name}
| Feature | How to Use |
|---------|------------|
| {Feature name} | {How a user performs this action} |

{Repeat for each logical category}

---

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| {Key combo} | {What it does} |

---

## CLI Commands (if applicable)
| Command | What it does |
|---------|--------------|
| {command} | {Description} |

---

## API Endpoints (for integrations)
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | /api/example | {Description} |

---

## Configuration Options
| Setting | What it controls |
|---------|------------------|
| {setting} | {Description} |

---

## Architecture
| Layer | Technology |
|-------|------------|
| Frontend | {e.g., Next.js} |
| Backend | {e.g., FastAPI} |
| Database | {e.g., SQLite} |
```

---

## Guidelines

1. **User-focused** - Document what users CAN DO, not code structure
2. **Action-oriented** - "Run a workflow" not "WorkflowRunner component exists"
3. **Include hidden features** - Shortcuts, CLI flags, config options users might miss
4. **Be exhaustive** - Every capability, even small ones
5. **How to use** - Brief instruction, not just feature name
6. **Skip empty sections** - Don't include API/CLI sections if not applicable

---

## Discovery Process

1. Check UI components - what buttons/actions exist?
2. Check routes/pages - what screens can users navigate to?
3. Check keyboard handlers - what shortcuts are registered?
4. Check API routes - what endpoints are available?
5. Check config files - what can users customize?
6. Check CLI entry points - what commands exist?
7. Check README/docs - what's already documented?

---

## Examples

**Good:**
| Feature | How to Use |
|---------|------------|
| Run LLM prompt | Select workflow → Click Execute |
| Copy to clipboard | Click copy icon on any result |
| Dark mode | Settings → Appearance → Toggle theme |

**Bad:**
| Feature | How to Use |
|---------|------------|
| WorkflowExecutor | Component that runs workflows |
| ClipboardService | Handles clipboard operations |
| ThemeProvider | Manages theme state |

---

## Save Location

Create `coderef/user/` directory if needed.
Save to: `coderef/user/features.md`
