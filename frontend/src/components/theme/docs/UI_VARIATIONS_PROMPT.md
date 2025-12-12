# UI Variations Prompt

## Prompt Text

```
Generate 5 CSS theme variations for the attached template. Each theme needs light and dark mode variants.

## Themes to Generate

1. **Modern Minimal** - Clean, lots of whitespace, understated elegance
2. **Modern Tech** - Bold accents, high contrast, sharp edges, futuristic feel
3. **Warm Organic** - Natural, soft, organic feel
4. **Cool Professional** - Calming, refreshing, business-appropriate
5. **LLM's Choice** - Your creative interpretation based on the project context

Choose colors that best express each style. You have full creative freedom.

## Requirements

- Use HSL format without wrapper: `H S% L%` (e.g., `222.2 84% 4.9%`)
- Follow the attached THEME_TEMPLATE.css structure exactly
- Ensure sufficient contrast between foreground/background
- Light mode: lighter backgrounds, darker text
- Dark mode: darker backgrounds, lighter text
- Primary should stand out for interactive elements

## Output Format

Single codeblock containing all 5 themes (10 selectors total).
Replace THEME_NAME with kebab-case theme id prefixed by your model name:
- {model}-modern-minimal
- {model}-modern-tech
- {model}-warm-organic
- {model}-cool-professional
- {model}-[your-choice-name]

Example: `claude-modern-minimal`, `gpt4-warm-organic`

## Attachments Required

1. THEME_DESIGNER_GUIDE.md - Variable reference
2. THEME_TEMPLATE.css - CSS structure template
```

## Usage

1. Copy prompt text above
2. Attach `THEME_DESIGNER_GUIDE.md` and `THEME_TEMPLATE.css`
3. Send to LLM
4. Save response as `{Model}-themes.css`
