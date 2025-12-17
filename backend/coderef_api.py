"""
CodeRef API Router
WO-CODEREF-SCRIPTBOARD-INTEGRATION-001

Provides FastAPI endpoints for CodeRef CLI operations:
- /scan - Scan directories for code elements
- /dashboard - Generate HTML dashboards
- /query - Query element dependencies
- /impact - Analyze change impact
"""
import asyncio
import json
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from coderef_config import (
    get_cli_command,
    is_cli_available,
    CLI_TIMEOUT,
    DASHBOARD_OUTPUT_DIR,
    DEFAULT_LANGUAGES,
    DEFAULT_EXCLUDE_PATTERNS,
)

router = APIRouter(prefix="/coderef", tags=["coderef"])


# Request/Response Models
class ScanRequest(BaseModel):
    source_dir: str
    languages: list[str] = DEFAULT_LANGUAGES
    exclude_patterns: list[str] = DEFAULT_EXCLUDE_PATTERNS
    use_ast: bool = False


class ScanElement(BaseModel):
    type: str
    name: str
    file: str
    line: int
    exported: bool = False


class ScanResponse(BaseModel):
    success: bool
    elements: list[dict]
    element_count: int
    by_type: dict[str, int]
    source_dir: str


class DashboardRequest(BaseModel):
    source_dir: str
    languages: list[str] = DEFAULT_LANGUAGES
    exclude_patterns: list[str] = DEFAULT_EXCLUDE_PATTERNS


class DashboardResponse(BaseModel):
    success: bool
    dashboard_path: str
    dashboard_url: str


class QueryRequest(BaseModel):
    target: str
    source_dir: Optional[str] = None


class QueryResponse(BaseModel):
    success: bool
    target: str
    results: list[dict]


class ImpactRequest(BaseModel):
    target: str
    source_dir: Optional[str] = None
    depth: int = 3


class ImpactResponse(BaseModel):
    success: bool
    target: str
    impact: dict


class StatusResponse(BaseModel):
    available: bool
    cli_path: str
    message: str


async def run_cli_command(args: list[str], timeout: int = CLI_TIMEOUT) -> tuple[str, str, int]:
    """Run a CLI command asynchronously and return stdout, stderr, return code."""
    cmd = get_cli_command() + args

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=timeout
        )

        return (
            stdout.decode("utf-8", errors="replace"),
            stderr.decode("utf-8", errors="replace"),
            process.returncode or 0
        )
    except asyncio.TimeoutError:
        process.kill()
        raise HTTPException(status_code=504, detail=f"CLI command timed out after {timeout}s")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CLI execution failed: {str(e)}")


@router.get("/status")
async def get_status() -> StatusResponse:
    """Check if CodeRef CLI is available."""
    from coderef_config import CODEREF_CLI_PATH

    available = is_cli_available()
    return StatusResponse(
        available=available,
        cli_path=CODEREF_CLI_PATH,
        message="CodeRef CLI is ready" if available else "CodeRef CLI not found at configured path"
    )


@router.post("/scan")
async def scan_codebase(request: ScanRequest) -> ScanResponse:
    """Scan a directory for code elements."""
    if not is_cli_available():
        raise HTTPException(status_code=503, detail="CodeRef CLI not available")

    # Validate source directory
    source_path = Path(request.source_dir)
    if not source_path.exists():
        raise HTTPException(status_code=400, detail=f"Directory not found: {request.source_dir}")

    # Build CLI arguments
    args = ["scan", request.source_dir]
    args.extend(["-l", ",".join(request.languages)])
    args.append("--json")

    if request.use_ast:
        args.append("--ast")

    for pattern in request.exclude_patterns:
        args.extend(["-e", pattern])

    # Run scan
    stdout, stderr, code = await run_cli_command(args)

    if code != 0:
        raise HTTPException(status_code=500, detail=f"Scan failed: {stderr}")

    # Parse results
    try:
        elements = json.loads(stdout)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse scan results")

    # Count by type
    by_type: dict[str, int] = {}
    for elem in elements:
        elem_type = elem.get("type", "unknown")
        by_type[elem_type] = by_type.get(elem_type, 0) + 1

    return ScanResponse(
        success=True,
        elements=elements,
        element_count=len(elements),
        by_type=by_type,
        source_dir=request.source_dir
    )


@router.post("/dashboard")
async def generate_dashboard(request: DashboardRequest) -> DashboardResponse:
    """Generate an HTML dashboard for a codebase."""
    if not is_cli_available():
        raise HTTPException(status_code=503, detail="CodeRef CLI not available")

    # Validate source directory
    source_path = Path(request.source_dir)
    if not source_path.exists():
        raise HTTPException(status_code=400, detail=f"Directory not found: {request.source_dir}")

    # Generate unique dashboard filename
    dashboard_id = uuid.uuid4().hex[:8]
    dashboard_file = DASHBOARD_OUTPUT_DIR / f"dashboard_{dashboard_id}.html"

    # Build CLI arguments
    args = ["dashboard", request.source_dir]
    args.extend(["-o", str(dashboard_file)])
    args.extend(["-l", ",".join(request.languages)])

    for pattern in request.exclude_patterns:
        args.extend(["-e", pattern])

    # Run dashboard generation
    stdout, stderr, code = await run_cli_command(args, timeout=120)

    if code != 0:
        raise HTTPException(status_code=500, detail=f"Dashboard generation failed: {stderr}")

    # Verify dashboard was created
    if not dashboard_file.exists():
        raise HTTPException(status_code=500, detail="Dashboard file was not created")

    return DashboardResponse(
        success=True,
        dashboard_path=str(dashboard_file),
        dashboard_url=f"/coderef/dashboards/{dashboard_id}"
    )


@router.get("/dashboards/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    """Serve a generated dashboard HTML file."""
    from fastapi.responses import FileResponse

    dashboard_file = DASHBOARD_OUTPUT_DIR / f"dashboard_{dashboard_id}.html"

    if not dashboard_file.exists():
        raise HTTPException(status_code=404, detail="Dashboard not found")

    return FileResponse(
        dashboard_file,
        media_type="text/html",
        filename=f"coderef_dashboard_{dashboard_id}.html"
    )


@router.post("/query")
async def query_dependencies(request: QueryRequest) -> QueryResponse:
    """Query element dependencies."""
    if not is_cli_available():
        raise HTTPException(status_code=503, detail="CodeRef CLI not available")

    # Build CLI arguments
    args = ["query", request.target, "--json"]

    if request.source_dir:
        args.append(request.source_dir)

    # Run query
    stdout, stderr, code = await run_cli_command(args)

    if code != 0:
        # Query might return empty results, not necessarily an error
        if "not found" in stderr.lower():
            return QueryResponse(
                success=True,
                target=request.target,
                results=[]
            )
        raise HTTPException(status_code=500, detail=f"Query failed: {stderr}")

    # Parse results
    try:
        results = json.loads(stdout) if stdout.strip() else []
    except json.JSONDecodeError:
        # If not JSON, return raw output as single result
        results = [{"raw": stdout}] if stdout.strip() else []

    return QueryResponse(
        success=True,
        target=request.target,
        results=results if isinstance(results, list) else [results]
    )


@router.post("/impact")
async def analyze_impact(request: ImpactRequest) -> ImpactResponse:
    """Analyze the impact of changing a code element."""
    if not is_cli_available():
        raise HTTPException(status_code=503, detail="CodeRef CLI not available")

    # Build CLI arguments
    args = ["impact", request.target, "--json"]
    args.extend(["--depth", str(request.depth)])

    if request.source_dir:
        args.append(request.source_dir)

    # Run impact analysis
    stdout, stderr, code = await run_cli_command(args)

    if code != 0:
        if "not found" in stderr.lower():
            return ImpactResponse(
                success=True,
                target=request.target,
                impact={"affected": [], "risk": "unknown", "message": "Element not found"}
            )
        raise HTTPException(status_code=500, detail=f"Impact analysis failed: {stderr}")

    # Parse results
    try:
        impact = json.loads(stdout) if stdout.strip() else {}
    except json.JSONDecodeError:
        impact = {"raw": stdout}

    return ImpactResponse(
        success=True,
        target=request.target,
        impact=impact
    )
