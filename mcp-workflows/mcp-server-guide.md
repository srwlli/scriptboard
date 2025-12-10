# Docs-MCP Server Guide

This guide outlines the workflows and capabilities of the `docs-mcp` server, designed to supercharge AI-assisted development through structured documentation, planning, and consistent standards.

## � Table of Contents
1.  [Core Feature Workflow](#-core-feature-workflow-the-happy-path)
2.  [Multi-Agent Workflows](#-multi-agent-workflows)
3.  [Documentation & Standards](#-documentation--standards-workflows)
4.  [Inventory & Analysis](#-inventory--analysis)

## �🚀 Core Feature Workflow (The "Happy Path")

The primary power of `docs-mcp` lies in its standardized feature lifecycle. Follow this sequence for every new feature to ensure consistent quality and documentation.

### 1. Planning (`/start-feature`)
**Trigger**: Start a new feature or task.
This is the master workflow that orchestrates the entire planning phase.
- **What it does**:
  1.  **Gathers Context**: Interactively asks for description, goals, and requirements.
  2.  **Analyzes Project**: Scans existing architecture and standards.
  3.  **Creates Plan**: Generates a 10-section `plan.json` with a unique Workorder ID.
  4.  **Validates Plan**: Automatically critiques and refines the plan until it scores >90.
- **Output**: `context.json`, `analysis.json`, `plan.json` in `coderef/working/{feature}/`.

### 2. Execution Setup (`/execute-plan`)
**Trigger**: Ready to start coding.
- **What it does**: Converts the `9_implementation_checklist` from your plan into a TodoWrite-compatible task list.
- **Output**: Displays a formatted list of tasks (e.g., `SETUP-001: Install dependencies`).

### 3. Implementation (Manual)
- **Action**: You (or the agent) implement the code following the generated tasks.
- **Guidance**: Use `/check-consistency` occasionally to ensure you aren't violating project standards.

### 4. Close-out (`/update-deliverables`)
**Trigger**: Feature implementation is complete.
- **What it does**: Scans git history for commits related to this feature.
- **Output**: Updates `DELIVERABLES.md` with:
  -  Total Lines of Code (LOC) added/removed.
  -  Number of commits and contributors.
  -  Time elapsed.

### 5. Documentation (`/update-docs`)
**Trigger**: After updating deliverables.
- **What it does**:
  1.  Auto-increments project version (minor for properties/features, patch for bugfixes).
  2.  Updates `CHANGELOG.json` and `CLAUDE.md`.
  3.  Updates `README.md` "What's New" section.
- **Note**: This ensures every feature is perfectly documented in the history.

### 6. Cleanup (`/archive-feature`)
**Trigger**: Feature is fully merged and documented.
- **What it does**: Moves the feature folder from `coderef/working/` to `coderef/archived/`.
- **Why**: Keeps your active workspace clean while preserving full history.

---

## 👥 Multi-Agent Workflows
For complex features requiring parallel work.

- **`/generate-agent-communication`**: Creates a protocol (`communication.json`) defining roles and forbidden files.
- **`/assign-agent-task`**: Assigns specific implementation phases to different agents (e.g., Agent 1: Setup, Agent 2: Backend).
- **`/verify-agent-completion`**: Automated QA that runs git diffs and verifies success criteria before an agent "submits" work.
- **`/track-agent-status`**: Real-time dashboard showing which agents are blocked, working, or verified.

---

## 📚 Documentation & Standards Workflows

### Foundation Documentation Workflow (`/generate-docs`)

**Trigger**: When starting a new project or onboarding an existing one.
- **What it does**: Establishes the "Big 5" core documents:
  1.  **README.md**: Project overview, setup, and usage.
  2.  **ARCHITECTURE.md**: System design, diagrams, and decisions.
  3.  **API.md**: Interface definitions and endpoints.
  4.  **COMPONENTS.md**: Reusable UI/logic component catalog.
  5.  **SCHEMA.md**: Data models and database schemas.
- **Process**:
  1.  **Analysis**: The agent scans the project structure to understand the stack.
  2.  **Generation**: Populates the POWER templates with project-specific details.
  3.  **Check**: You review the generated files.

#### Additional Guides
- **`/generate-user-guide`**: Creates a comprehensive, end-user focused manual.
- **`/generate-quickref`**: An interactive interview mode that creates a 1-page "cheat sheet" (CLI args, key shortcuts, etc.) tailored to your app type.

### Quality & Standards
- **`/establish-standards`**: Scans your valid code to generate `UI-STANDARDS.md`, `UX-PATTERNS.md`, etc. Run this once!
- **`/audit-codebase`**: rigorously compares all code against your standards and generates a graded report.
- **`/check-consistency`**: A fast, "pre-commit" style check that only looks at currently modified files.

---

## 🛠️ Inventory & Analysis
Tools for deep-diving into the codebase structure and health.

### Database Inventory (`/database-inventory`)
- **What it finds**: Tables, collections, models, and migrations.
- **Supported Systems**: PostgreSQL, MySQL, MongoDB, SQLite.
- **ORM Support**: SQLAlchemy, Sequelize, Mongoose.
- **Output**: `coderef/inventory/database.json` containing schema definitions and relationships.

### API Inventory (`/api-inventory`)
- **What it finds**: HTTP endpoints, methods (GET/POST), and signatures.
- **Supported Frameworks**: FastAPI, Flask, Express, GraphQL.
- **Documentation**: Checks for OpenAPI/Swagger coverage.
- **Output**: `coderef/inventory/api.json` with a list of all discoverable endpoints.

### Dependency Inventory (`/dependency-inventory`)
- **What it finds**: Packages, versions, and **security vulnerabilities** (via OSV API).
- **Supported Ecosystems**: npm, pip, cargo, composer.
- **Output**: `coderef/inventory/dependencies.json` listing outdated packages and security risks.

### Documentation Inventory (`/documentation-inventory`)
- **What it finds**: All docs (Markdown, RST, HTML, etc.) in the project.
- **Metrics**: Scores documentation based on "freshness" (last update), completeness, and coverage.
- **Output**: `coderef/inventory/documentation.json` with a quality grade (0-100).

