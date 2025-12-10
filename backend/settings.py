"""Default configuration for Scriptboard."""

# Default favorite folders (label, path)
DEFAULT_FAVORITES = [
    ("docs-mcp", r"C:/Users/willh/.mcp-servers/docs-mcp/coderef/working"),
    ("gridiron", r"C:/Users/willh/Desktop/latest-sim/gridiron-franchise/coderef"),
    ("scraper", r"C:/Users/willh/Desktop/projects - current-location/next-scraper/coderef"),
]

# Default LLM URLs (label, url)
DEFAULT_LLM_URLS = [
    ("GPT", "https://chat.openai.com"),
    ("Claude", "https://claude.ai"),
    ("Gemini", "https://gemini.google.com"),
    ("Pplx", "https://perplexity.ai"),
    ("Grok", "https://grok.x.ai"),
    ("Deep", "https://chat.deepseek.com"),
    ("Mistral", "https://chat.mistral.ai"),
]

# Pre-loaded prompts accessible via File > Prompts
# Format: "Key": ("Menu Label", "Prompt Text")
PRELOADED_PROMPTS = {
    "1": ("Code Review", (
        "CODE REVIEW TASK\n"
        "Review the attached code and any provided context for a comprehensive feature review.\n"
        "Output standard Markdown (.md) inside a SINGLE code block.\n\n"
        "## PART 1: EXISTING FEATURES\n"
        "1. Create an ORDERED LIST of existing features found in the code, ranked by Rating (1-10) from highest to lowest.\n"
        "2. Follow the list with a TABLE summarizing these features with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "3. Include ALL existing features identified in the list in this table.\n\n"
        "## PART 2: SUGGESTIONS FOR IMPROVEMENT\n"
        "4. Create an ORDERED LIST of suggested improvements/enhancements, ranked by Rating (1-10) from highest to lowest.\n"
        "5. Follow the list with a TABLE summarizing these suggestions with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "6. Include ALL suggestions identified in the list in this table."
    )),
    "2": ("Synthesize", (
        "SYNTHESIS TASK\n"
        "I have conducted multiple Code Reviews using different LLMs. Below are the Code Review responses.\n"
        "Please SYNTHESIZE these responses into a single, authoritative Code Review.\n"
        "Output format: Standard Markdown (.md) inside a SINGLE code block.\n\n"
        "## PART 1: SYNTHESIZED EXISTING FEATURES\n"
        "1. Review all PART 1 (EXISTING FEATURES) sections from the provided Code Reviews.\n"
        "2. Create a consolidated ORDERED LIST of all unique existing features, ranked by Rating (1-10) from highest to lowest.\n"
        "   - Merge duplicate features, keeping the highest rating and best description\n"
        "   - Resolve conflicts by prioritizing the most detailed/accurate description\n"
        "3. Follow the list with a TABLE summarizing these synthesized features with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "4. Include ALL unique features identified across all reviews in this table.\n\n"
        "## PART 2: SYNTHESIZED SUGGESTIONS FOR IMPROVEMENT\n"
        "5. Review all PART 2 (SUGGESTIONS FOR IMPROVEMENT) sections from the provided Code Reviews.\n"
        "6. Create a consolidated ORDERED LIST of all unique suggestions, ranked by Rating (1-10) from highest to lowest.\n"
        "   - Merge duplicate suggestions, keeping the highest rating and most comprehensive description\n"
        "   - Resolve conflicts by prioritizing the most actionable/valuable suggestion\n"
        "7. Follow the list with a TABLE summarizing these synthesized suggestions with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "8. Include ALL unique suggestions identified across all reviews in this table.\n\n"
        "## CONCLUSION\n"
        "9. Provide a brief summary highlighting:\n"
        "   - The most important features identified\n"
        "   - The highest-priority suggestions for improvement\n"
        "   - Any consensus or disagreements across the reviews"
    )),
    "3": ("Consolidate", (
        "CONSOLIDATION TASK\n"
        "I have multiple Synthesized Code Reviews from different synthesis runs. Below are the Synthesize outputs.\n"
        "Please create a FINAL MASTER CONSOLIDATION that combines all of these into one authoritative document.\n"
        "Output format: Standard Markdown (.md) inside a SINGLE code block.\n\n"
        "## PART 1: MASTER EXISTING FEATURES\n"
        "1. Review all PART 1 (SYNTHESIZED EXISTING FEATURES) sections from all Synthesize outputs.\n"
        "2. Create a FINAL consolidated ORDERED LIST of all unique features, ranked by Rating (1-10) from highest to lowest.\n"
        "   - Merge all features, keeping the highest rating and most comprehensive description\n"
        "   - Remove true duplicates (same feature, same description)\n"
        "   - Resolve conflicts by prioritizing the most detailed/accurate description\n"
        "   - Focus on the most important/valuable features\n"
        "3. Follow the list with a MASTER TABLE summarizing these final features with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "4. Include ALL unique features in this master table.\n\n"
        "## PART 2: MASTER SUGGESTIONS FOR IMPROVEMENT\n"
        "5. Review all PART 2 (SYNTHESIZED SUGGESTIONS FOR IMPROVEMENT) sections from all Synthesize outputs.\n"
        "6. Create a FINAL consolidated ORDERED LIST of all unique suggestions, ranked by Rating (1-10) from highest to lowest.\n"
        "   - Merge all suggestions, keeping the highest rating and most actionable description\n"
        "   - Remove true duplicates\n"
        "   - Resolve conflicts by prioritizing the most valuable/actionable suggestion\n"
        "   - Focus on high-impact, implementable improvements\n"
        "7. Follow the list with a MASTER TABLE summarizing these final suggestions with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "8. Include ALL unique suggestions in this master table.\n\n"
        "## MASTER CONCLUSION\n"
        "9. Provide an executive summary that:\n"
        "   - Highlights the top 5 most important features\n"
        "   - Highlights the top 5 highest-priority suggestions\n"
        "   - Identifies patterns and consensus across all synthesis runs\n"
        "   - Provides actionable next steps for implementation"
    )),
    "4": ("Research", (
        "RESEARCH TASK\n"
        "Research the provided subject/code context in depth.\n"
        "Output the results as a standard Markdown document (.md).\n\n"
        "Usage Requirements:\n"
        "1. Start with a Table of Contents (TOC) linking to sections.\n"
        "2. Use proper Markdown headers (#, ##, ###) for structure.\n"
        "3. Include citations or references where applicable.\n"
        "4. formatting must be clean and ready for documentation."
    )),
}
