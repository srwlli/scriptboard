# Generate Features Reference Guide

Create a **user reference guide** for this project. Focus on what users CAN DO, not what exists technically.

## Your Task

1. **Explore** the codebase to discover all user-facing capabilities
2. **Document** actionable features from the user's perspective
3. **Save** to `coderef/user/features.md`

---

## Output Format

```markdown
# {Project Name} - Features

> What you can do with this app

---

## {Category Name}

| Feature | How to Use |
|---------|------------|
| {What you can do} | {How to do it} |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| {Keys} | {What happens} |

---

## Settings & Configuration

| Setting | What it Controls |
|---------|------------------|
| {Option} | {Effect on your experience} |

---

## API Endpoints
{For integrations - skip if no backend}

| Endpoint | What You Can Do |
|----------|-----------------|
| {Method} {Path} | {Action it enables} |

---

## Tips & Hidden Features

- {Useful tip users might not discover}
```

---

## Key Principles

1. **"What can I DO?"** - Every row should be an action the user can take
2. **How-to focused** - Include the trigger/method, not just the feature name
3. **User language** - "Save your work" not "Persistence layer"
4. **Include shortcuts** - Keyboard, CLI, quick actions
5. **Skip technical details** - No architecture, no file paths, no implementation

---

## Discovery Process

- Find UI components and their interactions
- Look for keyboard event handlers
- Check for CLI commands or scripts
- Review settings/config UIs
- Identify API routes users might call
- Look for tooltips, help text, onboarding flows

---

## Output

Save to: `coderef/user/features.md`

Create the directory if needed.
