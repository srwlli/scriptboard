"""
Orchestrator API - Endpoints for cross-project tracking
WO-ORCHESTRATOR-DASHBOARD-001
"""

import os
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import httpx
from dotenv import load_dotenv
import asyncio

# Load environment variables from .env file
load_dotenv(Path(__file__).parent / ".env")

# Import WebSocket manager
from websocket_manager import manager

router = APIRouter(prefix="/orchestrator", tags=["orchestrator"])
# Gist configuration
GIST_CONFIG_PATH = Path(__file__).parent / "gist_config.json"
GITHUB_GIST_TOKEN = os.getenv("GITHUB_GIST_TOKEN")

# Projects configuration
PROJECTS_CONFIG_PATH = Path(__file__).parent / "projects.json"

ORCHESTRATOR_PATH = r"C:\Users\willh\Desktop\assistant"
PROJECTS_MD_PATH = os.path.join(ORCHESTRATOR_PATH, "projects.md")


def load_projects() -> list[str]:
    """Load project paths from projects.json config file."""
    try:
        if PROJECTS_CONFIG_PATH.exists():
            with open(PROJECTS_CONFIG_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [project['path'] for project in data.get('projects', [])]
        return []
    except (json.JSONDecodeError, IOError):
        return []


def save_projects(projects: list[dict]):
    """Save projects to projects.json config file."""
    try:
        data = {'projects': projects}
        # Atomic write
        temp_path = PROJECTS_CONFIG_PATH.with_suffix('.tmp')
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        temp_path.replace(PROJECTS_CONFIG_PATH)
        return True
    except (IOError, OSError):
        return False


def get_all_projects() -> list[dict]:
    """Load all projects with metadata from projects.json."""
    try:
        if PROJECTS_CONFIG_PATH.exists():
            with open(PROJECTS_CONFIG_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('projects', [])
        return []
    except (json.JSONDecodeError, IOError):
        return []


# Project paths to scan (loaded dynamically)
PROJECT_PATHS = load_projects()


def scan_json_files(base_path: str, pattern: str) -> list[dict]:
    """Scan for JSON files matching pattern and return parsed contents."""
    results = []
    coderef_path = os.path.join(base_path, "coderef")

    if not os.path.exists(coderef_path):
        return results

    for root, dirs, files in os.walk(coderef_path):
        for file in files:
            if file == pattern:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        data["_file_path"] = file_path
                        data["_project_path"] = base_path
                        data["_project_name"] = os.path.basename(base_path)
                        results.append(data)
                except (json.JSONDecodeError, IOError):
                    pass
    return results


def get_project_name(path: str) -> str:
    """Extract project name from path."""
    return os.path.basename(path)


def format_timestamp(dt: datetime = None) -> str:
    """
    Format datetime as human-readable timestamp: '2025-12-20 12:07 AM'
    If dt is None, uses current time.
    """
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%Y-%m-%d %I:%M %p")


def get_file_age(file_path: str) -> int:
    """
    Get file age in days since last modification.
    SCAN-005 - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    if not os.path.exists(file_path):
        return -1

    mtime = os.path.getmtime(file_path)
    modified = datetime.fromtimestamp(mtime)
    age_delta = datetime.now() - modified
    return age_delta.days


def atomic_write_json(file_path: str, data: dict) -> bool:
    """
    Atomically write JSON data to file using temp file + rename pattern.
    Prevents corruption from concurrent access or crashes mid-write.
    SCAN-009 - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    import tempfile
    import shutil

    try:
        # Write to temp file first
        temp_fd, temp_path = tempfile.mkstemp(suffix=".json", dir=os.path.dirname(file_path))
        with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        # Atomic rename (overwrites target on Windows/Unix)
        shutil.move(temp_path, file_path)
        return True
    except Exception as e:
        # Clean up temp file if it still exists
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return False


def load_gist_config() -> dict:
    """Load gist configuration from file."""
    if GIST_CONFIG_PATH.exists():
        with open(GIST_CONFIG_PATH, "r") as f:
            return json.load(f)
    return {}


def save_gist_config(config: dict):
    """Save gist configuration to file."""
    with open(GIST_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


async def create_gist(content: str) -> dict:
    """Create a new GitHub Gist."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.github.com/gists",
            headers={
                "Authorization": f"token {GITHUB_GIST_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json={
                "description": "Scriptboard Orchestrator Data",
                "public": False,
                "files": {
                    "orchestrator.json": {"content": content}
                }
            }
        )
        response.raise_for_status()
        return response.json()


async def update_gist(gist_id: str, content: str) -> dict:
    """Update an existing GitHub Gist."""
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"https://api.github.com/gists/{gist_id}",
            headers={
                "Authorization": f"token {GITHUB_GIST_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json={
                "files": {
                    "orchestrator.json": {"content": content}
                }
            }
        )
        response.raise_for_status()
        return response.json()




@router.get("/stats")
async def get_stats():
    """
    Get aggregate counts for dashboard overview.
    SCAN-010: Added stale_count and internal_count - WO-FILE-DISCOVERY-ENHANCEMENT-001
    STATS-001: Updated to count stubs from all projects - WO-MULTI-PROJECT-STUB-TRACKING-001
    """
    projects_count = len(PROJECT_PATHS)
    stubs_count = 0
    workorders_count = 0
    plans_count = 0
    stale_count = 0
    internal_count = 0

    # Count stubs from all projects (STATS-001)
    stubs_result = await get_stubs()
    stubs_count = len(stubs_result["stubs"])

    # Scan all projects
    for project_path in PROJECT_PATHS:
        # Count plans
        plans = scan_json_files(project_path, "plan.json")
        plans_count += len(plans)

        # Count workorders (communication.json with handoff)
        comms = scan_json_files(project_path, "communication.json")
        for comm in comms:
            if "handoff" in comm and comm.get("handoff", {}).get("status") != "complete":
                workorders_count += 1

    # Count stale plans (SCAN-010)
    stale_result = await get_stale_plans(days=7)
    stale_count = stale_result["count"]

    # Count internal workorders (SCAN-010)
    internal_result = await get_internal_workorders()
    internal_count = internal_result["count"]

    return {
        "projects": projects_count,
        "stubs": stubs_count,
        "active_workorders": workorders_count,
        "plans": plans_count,
        "stale_count": stale_count,
        "internal_count": internal_count,
    }


@router.get("/projects")
async def get_projects():
    """Get list of tracked projects with counts."""
    projects = []

    for project_path in PROJECT_PATHS:
        name = get_project_name(project_path)
        exists = os.path.exists(project_path)

        active_wos = 0
        active_plans = 0

        if exists:
            # Count active workorders
            comms = scan_json_files(project_path, "communication.json")
            for comm in comms:
                if "handoff" in comm and comm.get("handoff", {}).get("status") != "complete":
                    active_wos += 1

            # Count plans in working folder
            working_path = os.path.join(project_path, "coderef", "working")
            if os.path.exists(working_path):
                for folder in os.listdir(working_path):
                    plan_file = os.path.join(working_path, folder, "plan.json")
                    if os.path.exists(plan_file):
                        active_plans += 1

        projects.append({
            "name": name,
            "path": project_path,
            "exists": exists,
            "active_workorders": active_wos,
            "active_plans": active_plans,
        })

    return {"projects": projects}


@router.get("/stubs")
async def get_stubs(priority: Optional[str] = None, category: Optional[str] = None, project: Optional[str] = None):
    """Get all stubs from orchestrator and all projects."""
    stubs = []

    # Scan orchestrator working folder
    orchestrator_stubs_path = os.path.join(ORCHESTRATOR_PATH, "coderef", "working")
    if os.path.exists(orchestrator_stubs_path):
        for folder in os.listdir(orchestrator_stubs_path):
            stub_file = os.path.join(orchestrator_stubs_path, folder, "stub.json")
            if os.path.exists(stub_file):
                try:
                    with open(stub_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        data["folder"] = folder
                        # Default project if not specified in file
                        if "project" not in data:
                            data["project"] = "orchestrator"
                        stubs.append(data)
                except (json.JSONDecodeError, IOError):
                    pass

    # Scan all project paths for stubs
    for project_path in PROJECT_PATHS:
        project_name = get_project_name(project_path)
        for loc in ["working", "archived"]:
            loc_path = os.path.join(project_path, "coderef", loc)
            if not os.path.exists(loc_path):
                continue
            for folder in os.listdir(loc_path):
                stub_file = os.path.join(loc_path, folder, "stub.json")
                if os.path.exists(stub_file):
                    try:
                        with open(stub_file, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            data["folder"] = folder
                            # Use project from file or derive from path
                            if "project" not in data:
                                data["project"] = project_name
                            stubs.append(data)
                    except (json.JSONDecodeError, IOError):
                        pass

    # Apply filters
    if priority:
        stubs = [s for s in stubs if s.get("priority") == priority]
    if category:
        stubs = [s for s in stubs if s.get("category") == category]
    if project:
        stubs = [s for s in stubs if s.get("project") == project]

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    stubs.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 2))

    return {"stubs": stubs}


@router.get("/workorders")
async def get_workorders(project: Optional[str] = None, status: Optional[str] = None):
    """Get all active workorders across projects."""
    workorders = []

    for project_path in PROJECT_PATHS:
        project_name = get_project_name(project_path)

        if project and project_name != project:
            continue

        comms = scan_json_files(project_path, "communication.json")
        for comm in comms:
            if "handoff" not in comm:
                continue

            handoff = comm.get("handoff", {})
            wo_status = handoff.get("status", "unknown")

            if status and wo_status != status:
                continue

            workorders.append({
                "workorder_id": handoff.get("workorder_id"),
                "feature_name": handoff.get("feature_name"),
                "project": project_name,
                "status": wo_status,
                "type": handoff.get("type", "unknown"),
                "initiated_at": handoff.get("initiated_at"),
                "_file_path": comm.get("_file_path"),
            })

    return {"workorders": workorders}


@router.get("/plans")
async def get_plans(project: Optional[str] = None, location: Optional[str] = None, stale: bool = False, stale_days: int = 7):
    """
    Get all plans across projects.
    SCAN-006: Added stale_days parameter (default 7) - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    plans = []
    stale_threshold = datetime.now() - timedelta(days=stale_days)

    for project_path in PROJECT_PATHS:
        project_name = get_project_name(project_path)

        if project and project_name != project:
            continue

        # Scan working and archived folders
        locations = ["working", "archived"] if not location else [location]

        for loc in locations:
            loc_path = os.path.join(project_path, "coderef", loc)
            if not os.path.exists(loc_path):
                continue

            for folder in os.listdir(loc_path):
                plan_file = os.path.join(loc_path, folder, "plan.json")
                if not os.path.exists(plan_file):
                    continue

                try:
                    with open(plan_file, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    # Get file modification time
                    mtime = os.path.getmtime(plan_file)
                    modified = datetime.fromtimestamp(mtime)
                    is_stale = modified < stale_threshold

                    if stale and not is_stale:
                        continue

                    meta = data.get("META_DOCUMENTATION", {})

                    # Extract workorder_id from task system (SCAN-003)
                    task_system = data.get("UNIVERSAL_PLANNING_STRUCTURE", {}).get("5_task_id_system", {})
                    workorder_info = task_system.get("workorder", {})
                    workorder_id = workorder_info.get("id")

                    plans.append({
                        "feature_name": meta.get("feature_name", folder),
                        "project": meta.get("project", project_name),  # Prefer META_DOCUMENTATION.project
                        "location": loc,
                        "status": meta.get("status", "unknown"),
                        "last_modified": format_timestamp(modified),
                        "is_stale": is_stale,
                        "workorder_id": workorder_id,  # SCAN-003: Extract workorder_id
                        "_file_path": plan_file,
                    })
                except (json.JSONDecodeError, IOError):
                    pass

    return {"plans": plans}

@router.post("/sync-gist")
async def sync_to_gist():
    """Sync all orchestrator data to GitHub Gist for offline access."""
    if not GITHUB_GIST_TOKEN:
        return {"error": "GITHUB_GIST_TOKEN not configured"}

    # Collect all data
    stats = await get_stats()
    projects_data = await get_projects()
    stubs_data = await get_stubs()
    workorders_data = await get_workorders()
    plans_data = await get_plans()

    # Bundle into single JSON
    data = {
        "timestamp": format_timestamp(),
        "stats": stats,
        "projects": projects_data.get("projects", []),
        "stubs": stubs_data.get("stubs", []),
        "workorders": workorders_data.get("workorders", []),
        "plans": plans_data.get("plans", []),
    }

    content = json.dumps(data, indent=2)

    # Load existing gist config
    config = load_gist_config()
    gist_id = config.get("gist_id")

    try:
        if gist_id:
            # Update existing gist
            result = await update_gist(gist_id, content)
        else:
            # Create new gist
            result = await create_gist(content)
            gist_id = result["id"]
            # Save gist ID and raw URL for frontend
            config["gist_id"] = gist_id
            config["raw_url"] = result["files"]["orchestrator.json"]["raw_url"]
            config["html_url"] = result["html_url"]
            save_gist_config(config)

        return {
            "status": "success",
            "gist_id": gist_id,
            "raw_url": config.get("raw_url") or result["files"]["orchestrator.json"]["raw_url"],
            "timestamp": data["timestamp"],
        }
    except httpx.HTTPStatusError as e:
        return {"error": f"GitHub API error: {e.response.status_code}", "detail": str(e)}
    except Exception as e:
        return {"error": str(e)}


@router.get("/gist-config")
async def get_gist_config_endpoint():
    """Get the current gist configuration (for frontend to know the raw URL)."""
    config = load_gist_config()
    return {
        "configured": bool(config.get("gist_id")),
        "raw_url": config.get("raw_url"),
        "gist_id": config.get("gist_id"),
    }


# Workorder log file paths
WORKORDER_LOG_PATHS = [
    r"C:\Users\willh\.mcp-servers\coderef\workorder-log.txt",
    r"C:\Users\willh\Desktop\assistant\coderef\workorder-log.txt",
]

# Workorders.json central tracking file
WORKORDERS_JSON_PATH = r"C:\Users\willh\Desktop\assistant\workorders.json"


def parse_workorder_log(file_path: str) -> list[dict]:
    """Parse workorder log file. Format: WO-ID | Project | Description | Timestamp"""
    entries = []
    if not os.path.exists(file_path):
        return entries

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or not line.startswith("WO-"):
                    continue

                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 4:
                    entries.append({
                        "workorder_id": parts[0],
                        "project": parts[1],
                        "description": parts[2],
                        "timestamp": parts[3],
                        "_source": file_path,
                    })
                elif len(parts) >= 3:
                    entries.append({
                        "workorder_id": parts[0],
                        "project": parts[1],
                        "description": parts[2],
                        "timestamp": None,
                        "_source": file_path,
                    })
    except IOError:
        pass

    return entries


@router.get("/workorder-log")
async def get_workorder_log(project: Optional[str] = None, limit: int = 100):
    """Get workorder log entries from all log files."""
    all_entries = []

    for log_path in WORKORDER_LOG_PATHS:
        entries = parse_workorder_log(log_path)
        all_entries.extend(entries)

    # Filter by project if specified
    if project:
        all_entries = [e for e in all_entries if e.get("project") == project]

    # Sort by timestamp (newest first) - entries are already prepended, so reverse order
    # Limit results
    all_entries = all_entries[:limit]

    return {"entries": all_entries, "total": len(all_entries)}


def get_workorders_master() -> dict:
    """
    Parse workorders.json central tracking file.
    Returns the full workorders.json structure including active and completed workorders.
    SCAN-002 - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    if not os.path.exists(WORKORDERS_JSON_PATH):
        return {
            "error": "workorders.json not found",
            "path": WORKORDERS_JSON_PATH,
            "active_workorders": [],
            "completed_workorders": [],
        }

    try:
        with open(WORKORDERS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except (json.JSONDecodeError, IOError) as e:
        return {
            "error": f"Failed to parse workorders.json: {str(e)}",
            "path": WORKORDERS_JSON_PATH,
            "active_workorders": [],
            "completed_workorders": [],
        }


@router.get("/workorders-master")
async def get_workorders_master_endpoint():
    """
    Get workorders.json central tracking file content.
    Returns all active and completed workorders from the orchestrator's master tracking file.
    SCAN-001 - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    data = get_workorders_master()
    return data


@router.get("/internal-workorders")
async def get_internal_workorders(project: Optional[str] = None):
    """
    Detect internal workorders: plans with workorder_id but NO communication.json.
    These are plans that have been created but not yet delegated or externally tracked.
    SCAN-004 - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    internal_wos = []

    for project_path in PROJECT_PATHS:
        project_name = get_project_name(project_path)

        if project and project_name != project:
            continue

        # Only scan working folder for active internal workorders
        loc_path = os.path.join(project_path, "coderef", "working")
        if not os.path.exists(loc_path):
            continue

        for folder in os.listdir(loc_path):
            plan_file = os.path.join(loc_path, folder, "plan.json")
            comm_file = os.path.join(loc_path, folder, "communication.json")

            # Must have plan.json
            if not os.path.exists(plan_file):
                continue

            # Must NOT have communication.json (that's what makes it "internal")
            if os.path.exists(comm_file):
                continue

            try:
                with open(plan_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                meta = data.get("META_DOCUMENTATION", {})
                task_system = data.get("UNIVERSAL_PLANNING_STRUCTURE", {}).get("5_task_id_system", {})
                workorder_info = task_system.get("workorder", {})
                workorder_id = workorder_info.get("id")

                # Only include if it has a workorder_id
                if not workorder_id:
                    continue

                # Get file modification time
                mtime = os.path.getmtime(plan_file)
                modified = datetime.fromtimestamp(mtime)

                internal_wos.append({
                    "workorder_id": workorder_id,
                    "feature_name": meta.get("feature_name", folder),
                    "project": project_name,
                    "status": meta.get("status", "unknown"),
                    "last_modified": format_timestamp(modified),
                    "_file_path": plan_file,
                    "_type": "internal",
                })
            except (json.JSONDecodeError, IOError):
                pass

    return {"workorders": internal_wos, "count": len(internal_wos)}


@router.get("/stale")
async def get_stale_plans(days: int = 7, project: Optional[str] = None):
    """
    Get only stale plans (plans older than N days without updates).
    Dedicated endpoint for stale plan detection.
    SCAN-007 - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    # Reuse get_plans with stale=True filter
    result = await get_plans(project=project, stale=True, stale_days=days)
    return {"plans": result["plans"], "count": len(result["plans"]), "threshold_days": days}


@router.post("/register-internal")
async def register_internal_workorder(workorder_id: str, feature_name: str, project: str, description: str):
    """
    Register an internal workorder to workorders.json central tracking.
    Converts a discovered internal workorder (plan with no communication.json) into a tracked workorder.
    SCAN-008 - WO-FILE-DISCOVERY-ENHANCEMENT-001
    """
    # Load current workorders.json
    data = get_workorders_master()

    if "error" in data:
        return {"success": False, "error": data["error"]}

    # Create new workorder entry
    new_entry = {
        "workorder_id": workorder_id,
        "type": "internal",
        "feature_name": feature_name,
        "target_project": project,
        "status": "plan_created",
        "created": format_timestamp(),
        "description": description,
    }

    # Add to active_workorders
    if "active_workorders" not in data:
        data["active_workorders"] = []

    # Check if already exists
    existing = [wo for wo in data["active_workorders"] if wo.get("workorder_id") == workorder_id]
    if existing:
        return {"success": False, "error": f"Workorder {workorder_id} already exists"}

    data["active_workorders"].append(new_entry)
    data["last_updated"] = format_timestamp()

    # Atomic write
    success = atomic_write_json(WORKORDERS_JSON_PATH, data)

    if success:
        return {"success": True, "workorder": new_entry}
    else:
        return {"success": False, "error": "Failed to write workorders.json"}


@router.post("/projects")
async def add_project(name: str, path: str):
    """
    Add a new project to the orchestrator tracking.
    Validates the path exists and has a coderef folder before adding.
    """
    try:
        # Validate path exists
        if not os.path.exists(path):
            return {"success": False, "error": f"Path does not exist: {path}"}

        # Check for coderef folder
        coderef_path = os.path.join(path, "coderef")
        if not os.path.exists(coderef_path):
            return {"success": False, "error": f"No coderef folder found at {path}"}

        # Load current projects
        projects = get_all_projects()

        # Check if project with same name or path already exists
        for project in projects:
            if project['name'] == name:
                return {"success": False, "error": f"Project with name '{name}' already exists"}
            if project['path'] == path:
                return {"success": False, "error": f"Project with path '{path}' already exists"}

        # Add new project
        new_project = {"name": name, "path": path}
        projects.append(new_project)

        # Save to file
        if save_projects(projects):
            # Reload PROJECT_PATHS global
            global PROJECT_PATHS
            PROJECT_PATHS = load_projects()
            return {"success": True, "project": new_project}
        else:
            return {"success": False, "error": "Failed to save projects.json"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.delete("/projects/{project_name}")
async def remove_project(project_name: str):
    """
    Remove a project from orchestrator tracking.
    Does not delete any files, only removes from tracking list.
    """
    try:
        # Load current projects
        projects = get_all_projects()

        # Find and remove the project
        original_count = len(projects)
        projects = [p for p in projects if p['name'] != project_name]

        if len(projects) == original_count:
            return {"success": False, "error": f"Project '{project_name}' not found"}

        # Save to file
        if save_projects(projects):
            # Reload PROJECT_PATHS global
            global PROJECT_PATHS
            PROJECT_PATHS = load_projects()
            return {"success": True, "message": f"Project '{project_name}' removed from tracking"}
        else:
            return {"success": False, "error": "Failed to save projects.json"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time orchestrator updates.
    Maintains connection with heartbeat ping/pong every 30 seconds.
    """
    await manager.connect(websocket)

    try:
        # Heartbeat ping task
        async def send_ping():
            while True:
                try:
                    await asyncio.sleep(30)
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break

        # Start heartbeat task
        ping_task = asyncio.create_task(send_ping())

        # Listen for client messages (pong responses)
        while True:
            data = await websocket.receive_text()
            # Client can send pong or other messages
            # We don't need to act on them, just keep connection alive

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        ping_task.cancel()
    except Exception as e:
        manager.disconnect(websocket)
        if 'ping_task' in locals():
            ping_task.cancel()
