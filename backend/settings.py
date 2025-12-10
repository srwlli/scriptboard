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
        "1. Create an ORDERED LIST of 20 discrete features/suggestions found in the code, ranked by Rating (1-10) from highest to lowest.\n"
        "2. Follow the list with a TABLE summarizing these features with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "3. Include ALL features identified in the list in this table."
    )),
    "2": ("Synthesize", (
        "SYNTHESIS TASK\n"
        "I have conducted a multi-model evaluation. Below are responses from different LLMs.\n"
        "Please SYNTHESIZE these responses into a single, authoritative answer.\n"
        "Output format: Standard Markdown (.md).\n\n"
        "Structure:\n"
        "1. Create an ORDERED LIST of synthesized solutions/insights, ranked by Rating (1-10) from highest to lowest.\n"
        "2. Follow the list with a TABLE summarizing these items with columns: Name, Description, Value (Benefit), Rating (1-10), Risk (1-10).\n"
        "3. **Conclusion**: Provide the final unified solution in a clear code block or explanation."
    )),
    "3": ("Research", (
        "RESEARCH TASK\n"
        "Research the provided subject/code context in depth.\n"
        "Output the results as a standard Markdown document (.md).\n\n"
        "Usage Requirements:\n"
        "1. Start with a Table of Contents (TOC) linking to sections.\n"
        "2. Use proper Markdown headers (#, ##, ###) for structure.\n"
        "3. Include citations or references where applicable.\n"
        "4. formatting must be clean and ready for documentation."
    )),
    "4": ("Architect", (
        "SYSTEM ARCHITECTURE TASK\n"
        "Analyze the provided code/requirements from an architectural perspective.\n"
        "Output format: Standard Markdown (.md).\n\n"
        "required Sections:\n"
        "1. **Design Patterns**: List patterns identified or recommended.\n"
        "2. **Component Map**: Outline data flow and relationships.\n"
        "3. **Improvements**: Bulleted list of scalability/modularity suggestions.\n"
        "4. **Diagram**: Provide a Mermaid.js graph inside a ```mermaid code block."
    )),
    "5": ("Audit", (
        "SECURITY & ROBUSTNESS AUDIT\n"
        "Perform a strict audit of the attached code.\n"
        "Output format: Standard Markdown (.md).\n\n"
        "1. Create a **Findings Table** with columns: Issue Type, Description, Severity (High/Med/Low), Mitigation.\n"
        "2. Follow with a **Detailed Analysis** section expanding on critical issues.\n"
        "3. Conclude with a **Refactored Snippet** (in a code block) demonstrating the fix for the highest risk item."
    )),
    "6": ("Consolidate", (
        "CONSOLIDATION TASK\n"
        "Review the provided LLM responses regarding improvements.\n"
        "Consolidate these into a master list and table.\n"
        "Output standard Markdown (.md) inside a SINGLE code block.\n\n"
        "1. Create an ORDERED LIST of all suggestions/improvements, ranked by importance (Highest to Lowest).\n"
        "2. Follow the list with a TABLE summarizing all items with columns: Name, Description, Value, Importance (1-10).\n"
        "3. Ensure EVERY suggestion from the source responses is included."
    )),
}
