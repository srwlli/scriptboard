# Architecture Documentation

## Module Dependency Graph

*Run `coderef index` to generate module dependency diagrams and metrics.*

## Code Patterns

### Handler Functions

- `handle_drop` in `coderef\archived\scriptboard.py`
- `handle_prompt_drop` in `coderef\archived\scriptboard.py`

### Common Decorators

- `@app.get` (38 uses)
- `@app.post` (24 uses)
- `@patch` (23 uses)
- `@dataclass` (8 uses)
- `@pytest.fixture` (6 uses)
- `@app.delete` (5 uses)
- `@classmethod` (5 uses)
- `@app.exception_handler` (3 uses)
- `@property` (3 uses)
- `@app.on_event` (1 uses)

### Error Types

- `GitCommandError`
- `PermissionError`
- `ValueError`
- `OSError`
- `HTTPException`
- `FileNotFoundError`
- `RuntimeError`
- `ImportError`

## API Architecture

**Frameworks:** FastAPI
**Authentication:** Unknown
**Error Format:** RFC 7807
**Endpoint Count:** 67

## Recent Activity


*Generated: 2025-12-15T15:57:09.926762*