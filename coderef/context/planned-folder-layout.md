1. Create the planned folder layout

From C:\Users\willh\Desktop\clipboard_compannion\next:

mkdir backend
mkdir frontend
mkdir shell
mkdir backend\sessions
mkdir backend\logs


Now move files into backend:

move schemas.py backend\
move scriptboard.py backend\
move settings.py backend\


You should now have:

next/
  backend/
    schemas.py
    scriptboard.py   # old Tk app (reference only)
    settings.py
    sessions/
    logs/
  final-spec.md
  step-by-step.md
  frontend/
  shell/


We’ll treat scriptboard.py as reference while we build core.py + api.py.

2. Create core.py and api.py stubs

In backend, create two empty files:

core.py

api.py

For now, drop minimal skeletons inside so the project is importable.

backend/core.py (stub):

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Dict

from settings import DEFAULT_FAVORITES, DEFAULT_LLM_URLS


@dataclass
class Attachment:
    id: str
    filename: str
    content: str
    binary: bool = False

    @property
    def lines(self) -> int:
        if self.binary or not self.content:
            return 0
        return self.content.count("\n") + 1


@dataclass
class ResponseItem:
    id: str
    source: str
    content: str


class ScriptboardCore:
    def __init__(self, config: Optional[Dict] = None) -> None:
        config = config or {}
        self.prompt: str = ""
        self.prompt_source: Optional[str] = None
        self.attachments: List[Attachment] = []
        self.responses: List[ResponseItem] = []
        self.favorites = config.get("favorites", DEFAULT_FAVORITES)
        self.llm_urls = config.get("llm_urls", DEFAULT_LLM_URLS)
        self.current_profile: Optional[str] = None

    # TODO: port logic from scriptboard.py into methods like:
    # set_prompt, clear_prompt, add_attachment_from_text, add_response, etc.

    def get_session_summary(self) -> Dict:
        total_chars = len(self.prompt) + sum(len(a.content) for a in self.attachments) + sum(
            len(r.content) for r in self.responses
        )
        return {
            "has_prompt": bool(self.prompt),
            "prompt_source": self.prompt_source,
            "attachment_count": len(self.attachments),
            "response_count": len(self.responses),
            "total_chars": total_chars,
            "current_profile": self.current_profile,
            "total_tokens": None,  # to be filled in when token counting is added
        }


backend/api.py (stub using schemas.py):

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core import ScriptboardCore
from schemas import (
    TextPayload,
    SessionSummary,
    ErrorResponse,
)

app = FastAPI(title="Scriptboard Backend")

# CORS for local Next frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

core = ScriptboardCore(config={})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/session", response_model=SessionSummary)
def get_session():
    return core.get_session_summary()


@app.post("/prompt", response_model=SessionSummary, responses={400: {"model": ErrorResponse}})
def set_prompt(payload: TextPayload):
    # TODO: implement core.set_prompt
    core.prompt = payload.text
    core.prompt_source = "API"
    return core.get_session_summary()


This gives you a runnable backend skeleton that already uses schemas.py.

3. Create a Python venv & install backend deps

From the next directory:

python -m venv .venv
.\.venv\Scripts\activate
pip install fastapi uvicorn pydantic tiktoken gitpython python-dotenv


(You can add more later when you get to PDF, etc.)

4. Smoke test the backend

From next (with venv active):

uvicorn backend.api:app --reload --port 8000


Then open in a browser:

http://127.0.0.1:8000/health

http://127.0.0.1:8000/session

http://127.0.0.1:8000/docs (FastAPI docs)

If those work, you have:

schemas.py wired correctly

the ScriptboardCore stub working

the foundation ready to start migrating logic from scriptboard.py