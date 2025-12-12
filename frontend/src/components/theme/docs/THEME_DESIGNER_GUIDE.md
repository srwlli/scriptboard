# Theme Designer Guide

## Variables
| Variable | Purpose |
|----------|---------|
| `--background` | Page/card backgrounds |
| `--foreground` | Primary text |
| `--primary` | Buttons, links, active states |
| `--primary-foreground` | Text on primary |
| `--secondary` | Secondary buttons, cards |
| `--secondary-foreground` | Text on secondary |
| `--muted` | Disabled, subtle backgrounds |
| `--muted-foreground` | Placeholder text |
| `--accent` | Hover states |
| `--accent-foreground` | Text on accent |
| `--border` | Borders, dividers |

## Format
HSL without wrapper: `H S% L%` (e.g., `222.2 84% 4.9%`)

## Selector
```css
[data-theme="name"][data-mode="light"] { }
[data-theme="name"][data-mode="dark"] { }
```
