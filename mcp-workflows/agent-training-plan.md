# Agent Training Plan: Zero-Dependency Foundation Docs Workflow

This plan outlines how to train an AI agent to execute the "Foundation Docs Workflow" WITHOUT access to the `docs-mcp` server. The goal is to teach the agent to replicate the high-quality output and standardized structure of the MCP server tools manually.

## 🎯 Objective
Enable an independent AI agent to generate the "Big 5" foundation documents (`README.md`, `ARCHITECTURE.md`, `API.md`, `COMPONENTS.md`, `SCHEMA.md`) following the POWER framework, using only standard file reading/writing capabilities.

## 🧠 Core Strategy: Context Injection & Few-Shot Prompting
Since the agent lacks the MCP server's hard-coded templates and logic, we must provide:
1.  **The "Why"**: The philosophy behind the POWER framework.
2.  **The "What"**: Explicit templates for each document type.
3.  **The "How"**: A strict step-by-step Standard Operating Procedure (SOP).

---

## 📅 Implementation Plan

### Phase 1: Create the "Docs Training Manual"
We will create a single markdown file (`docs-agent-manual.md`) that serves as the "brain" for the agent. This file will contain:

1.  **Workflow Protocol**:
    *   **Step 1: Discovery**: Instructions on how to scan the codebase (e.g., "Read `package.json`, `requirements.txt`, and file tree").
    *   **Step 2: Analysis**: Questions the agent must answer before writing (e.g., "What is the tech stack?", "What is the primary user journey?").
    *   **Step 3: Drafting**: The order of operations (README first, then ARCHITECTURE...).

2.  **The POWER Templates**:
    *   Full-text markdown templates for the Big 5 documents.
    *   *Prompt Engineering*: We will rewrite the MCP templates into prompt-ready formats (e.g., replace `{{ variable }}` with `[INSERT PROJECT NAME HERE]`).

3.  **Quality Standards**:
    *   A checklist the agent must self-evaluate against (e.g., "Did I include a 'Getting Started' section?", "Are all diagrams Mermaid.js compatible?").

### Phase 2: Building the Artifacts
We need to extract the "wisdom" from the MCP server and format it for the agent.

*   **Task 2.1**: Extract templates from `docs-mcp` (we have `CLAUDE.md` which references them, but we might need to "reverse engineer" the exact structure if we can't read the raw template files directly, or we can use the descriptions to recreate them).
*   **Task 2.2**: Write the `docs-agent-manual.md`.
*   **Task 2.3**: Create a "System Prompt" snippet that users can paste to "boot up" the agent.

### Phase 3: The "Boot-Up" Prompt
We will design a specific prompt effectively says:
> "You are now the Documentation Specialist. Read the attached `docs-agent-manual.md` and wait for my command. Your goal is to strictly follow the Foundation Docs Workflow described therein."

---

## 📋 Deliverables

1.  **`agent-docs-manual.md`**: The comprehensive guide containing the SOP and Templates.
2.  **`boot-up-prompt.md`**: The exact text to send to a vanilla LLM to activate this persona.
3.  **`workflow-checklist.md`**: A simple checklist for the user to track the agent's progress.

## 🚀 Execution Steps (Next Actions)

1.  [ ] **Extract Templates**: I will read the `CLAUDE.md` again to understand the exact structure of the "Big 5" docs `docs-mcp` produces.
2.  [ ] **Draft Manual**: I will create `agent-docs-manual.md` in your scratch directory.
3.  [ ] **Draft Prompt**: I will create `boot-up-prompt.md`.

Shall I proceed with **Phase 1** and start drafting the `agent-docs-manual.md`?
