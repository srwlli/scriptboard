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
from fastapi import APIRouter

router = APIRouter(prefix="/orchestrator", tags=["orchestrator"])

# Project paths to scan
PROJECT_PATHS = [
    r"C:\Users\willh\Desktop\clipboard_compannion\next",
    r"C:\Users\willh\Desktop\scrapper",
    r"C:\Users\willh\Desktop\latest-sim\gridiron-franchise",
    r"C:\Users\willh\Desktop\projects\noted",
    r"C:\Users\willh\Desktop\app_documents",
    r"C:\Users\willh\Desktop\projects\coderef-system",
    r"C:\Users\willh\Desktop\Business-Dash\latest-app",
]

ORCHESTRATOR_PATH = r"C:\Users\willh\Desktop\assistant"
PROJECTS_MD_PATH = os.path.join(ORCHESTRATOR_PATH, "projects.md")


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


@router.get("/stats")
async def get_stats():
    """Get aggregate counts for dashboard overview."""
    projects_count = len(PROJECT_PATHS)
    stubs_count = 0
    workorders_count = 0
    plans_count = 0

    # Count stubs from orchestrator
    stubs_path = os.path.join(ORCHESTRATOR_PATH, "coderef", "working")
    if os.path.exists(stubs_path):
        for folder in os.listdir(stubs_path):
            stub_file = os.path.join(stubs_path, folder, "stub.json")
            if os.path.exists(stub_file):
                stubs_count += 1

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

    return {
        "projects": projects_count,
        "stubs": stubs_count,
        "active_workorders": workorders_count,
        "plans": plans_count,
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
async def get_stubs(priority: Optional[str] = None, category: Optional[str] = None):
    """Get all stubs from orchestrator."""
    stubs = []
    stubs_path = os.path.join(ORCHESTRATOR_PATH, "coderef", "working")

    if not os.path.exists(stubs_path):
        return {"stubs": stubs}

    for folder in os.listdir(stubs_path):
        stub_file = os.path.join(stubs_path, folder, "stub.json")
        if os.path.exists(stub_file):
            try:
                with open(stub_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    data["folder"] = folder

                    # Apply filters
                    if priority and data.get("priority") != priority:
                        continue
                    if category and data.get("category") != category:
                        continue

                    stubs.append(data)
            except (json.JSONDecodeError, IOError):
                pass

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
async def get_plans(project: Optional[str] = None, location: Optional[str] = None, stale: bool = False):
    """Get all plans across projects."""
    plans = []
    stale_threshold = datetime.now() - timedelta(days=7)

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

                    plans.append({
                        "feature_name": meta.get("feature_name", folder),
                        "project": project_name,
                        "location": loc,
                        "status": meta.get("status", "unknown"),
                        "last_modified": modified.isoformat(),
                        "is_stale": is_stale,
                        "_file_path": plan_file,
                    })
                except (json.JSONDecodeError, IOError):
                    pass

    return {"plans": plans}
