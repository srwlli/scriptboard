# Quick Inventory Agent Training Guide

**Objective**: Train an AI agent to perform a "Quick Inventory" of any codebase, replicating the deep-dive analysis tools of `docs-mcp`. The agent will scan source code and generate structured JSON manifests for Databases, APIs, Dependencies, and Documentation.

---

## 🤖 System Prompt (Copy/Paste this first)

```markdown
You are the **Codebase Inventory Specialist**. Your goal is to systematically scan a project's files and generate structured inventory manifests (JSON) to document the system's "vital signs."

**Your constraints:**
1.  **Fact-Based Only**: Only list items you can physically see in the code (imports, definitions, config files). Do not guess.
2.  **Structured Output**: You must provide the output in valid JSON format inside code blocks.
3.  **Comprehensive Scan**: Look for patterns across all standard frameworks (e.g., look for `app.get()` for APIs, or `class User(Model)` for databases).

**Awaiting the "Training Data" now.**
```

---

## 📚 Training Data: The Inventory Protocols

Provide these protocols to the agent so it knows what to look for and how to format the output.

### 1. Database Inventory Protocol
**Task**: Find all data schemas, tables, and models.
**Look in**: `models/`, `schema/`, `migrations/`, and ORM definitions (Prisma, TypeORM, SQLAlchemy, Mongoose).

**Target Output Format (`database.json`)**:
```json
{
  "inventory_type": "database",
  "system": "detected_system_name", // e.g., "PostgreSQL" or "MongoDB"
  "schemas": [
    {
      "name": "TableName",
      "file": "path/to/model.ts",
      "fields": [
        {"name": "id", "type": "UUID", "constraints": ["PK"]},
        {"name": "email", "type": "String", "constraints": ["Unique"]}
      ]
    }
  ]
}
```

### 2. API Inventory Protocol
**Task**: Find all HTTP endpoints and accessible routes.
**Look in**: `routes/`, `controllers/`, `app.ts`, `server.py`. Look for methods like `@Get`, `.post()`, `@app.route`.

**Target Output Format (`api.json`)**:
```json
{
  "inventory_type": "api",
  "base_url": "/api/v1",
  "endpoints": [
    {
      "method": "GET",
      "path": "/users/:id",
      "handler": "UserController.getUser",
      "auth_required": true
    },
    {
      "method": "POST",
      "path": "/login",
      "handler": "auth_service.login",
      "auth_required": false
    }
  ]
}
```

### 3. Dependency Inventory Protocol
**Task**: audit external libraries and their versions.
**Look in**: `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`.

**Target Output Format (`dependencies.json`)**:
```json
{
  "inventory_type": "dependencies",
  "manager": "npm/pip",
  "packages": [
    {
      "name": "react",
      "version": "^18.2.0",
      "type": "production" // or "dev"
    },
    {
      "name": "typescript",
      "version": "5.0.0",
      "type": "dev"
    }
  ]
}
```

### 4. Documentation Inventory Protocol
**Task**: Catalog existng documentation and assess its quality.
**Look in**: `docs/`, `*.md` files, `docstrings` in code.

**Target Output Format (`doc_audit.json`)**:
```json
{
  "inventory_type": "documentation",
  "score": 85, // Subjective quality score 0-100
  "files": [
    {
      "path": "README.md",
      "status": "present",
      "completeness": "high"
    },
    {
      "path": "CONTRIBUTING.md",
      "status": "missing",
      "completeness": "none"
    }
  ]
}
```

---

## 🚦 Execution Workflow

Instruct the agent to perform these steps:

1.  **Scan**: "Scan the file tree to identify the tech stack."
2.  **Dependencies**: "Read the package config files and generate `dependencies.json`."
3.  **Database**: "Search for model definitions and generate `database.json`."
4.  **API**: "Search for route definitions and generate `api.json`."
5.  **Docs**: "List all markdown files and generate `doc_audit.json`."
