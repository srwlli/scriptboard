"""
CodeRef CLI Configuration
WO-CODEREF-SCRIPTBOARD-INTEGRATION-001
"""
import os
from pathlib import Path

# CodeRef CLI path - configurable via environment variable
CODEREF_CLI_PATH = os.getenv(
    "CODEREF_CLI_PATH",
    "C:/Users/willh/Desktop/projects/coderef-system/packages/cli/dist/cli.js"
)

# Node.js executable
NODE_PATH = os.getenv("NODE_PATH", "node")

# Default scan settings
DEFAULT_LANGUAGES = ["ts", "tsx", "js", "jsx"]
DEFAULT_EXCLUDE_PATTERNS = ["**/node_modules/**", "**/dist/**", "**/.git/**"]

# Timeout for CLI operations (in seconds)
CLI_TIMEOUT = 60

# Dashboard output directory
DASHBOARD_OUTPUT_DIR = Path(__file__).parent / "coderef_dashboards"
DASHBOARD_OUTPUT_DIR.mkdir(exist_ok=True)


def get_cli_command() -> list[str]:
    """Get the base CLI command as a list."""
    return [NODE_PATH, CODEREF_CLI_PATH]


def is_cli_available() -> bool:
    """Check if the CodeRef CLI is available."""
    cli_path = Path(CODEREF_CLI_PATH)
    return cli_path.exists()
