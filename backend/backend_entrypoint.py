"""
Backend entry point for PyInstaller bundling.
This script starts the Uvicorn server with the FastAPI app.
"""
import sys
import os
import io

# Fix for PyInstaller windowless mode: sys.stdout/stderr are None
# which breaks uvicorn's logging TTY detection
if sys.stdout is None:
    sys.stdout = io.StringIO()
if sys.stderr is None:
    sys.stderr = io.StringIO()

import uvicorn
from api import app

if __name__ == "__main__":
    # Use access_log=False to avoid logging issues in windowless mode
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="warning",
        access_log=False
    )
