"""
Scriptboard - Collect LLM JSON responses (refactored)
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import webbrowser
from dataclasses import dataclass
from typing import List, Dict, Optional

import tkinter as tk
from tkinter import scrolledtext, filedialog, simpledialog, messagebox

import pyperclip

try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    HAS_DND = True
except ImportError:
    HAS_DND = False

from settings import DEFAULT_FAVORITES, DEFAULT_LLM_URLS, PRELOADED_PROMPTS


# --- UI / Theme constants -------------------------------------------------


class UI:
    BG = "#010409"
    PANEL = "#0d1117"
    BORDER = "#21262d"
    TEXT = "#c9d1d9"
    MUTED = "#8b949e"
    MUTED_ALT = "#6e7681"
    ACCENT = "#58a6ff"
    DANGER = "#f85149"
    BUTTON_BG = "#161b22"
    BUTTON_ACTIVE = "#21262d"
    BUTTON_PRIMARY = "#1a7f37"
    BUTTON_PRIMARY_ACTIVE = "#238636"

    FONT_BASE = ("Segoe UI", 9)
    FONT_MONO = ("Consolas", 10)


class Layout:
    # Standardized vertical padding
    FAVORITES_PAD = (16, 8)
    DIVIDER_PAD = (8, 8)
    SECTION_PAD = (8, 8)
    ROW_PAD = (8, 8)
    STATUS_PAD = (8, 0)


@dataclass
class Attachment:
    filename: str
    content: str

    @property
    def lines(self) -> int:
        if not self.content:
            return 0
        # Count lines without splitting entire string for huge files
        return self.content.count("\n") + 1


class Scriptboard:
    def __init__(self) -> None:
        self._init_state()
        self._init_root()
        self._build_ui()
        self._bind_shortcuts()
        self._bind_window_size()

    # ------------------------------------------------------------------ #
    # Init & state
    # ------------------------------------------------------------------ #

    def _init_state(self) -> None:
        self.responses: List[Dict[str, str]] = []
        self.prompt: str = ""
        self.prompt_source: Optional[str] = None
        self.prompt_paste_count: int = 0
        self.feature_folder: Optional[str] = None
        self.attachments: List[Attachment] = []
        self.attach_status_labels: list[tk.Label] = []
        self.management_status_label: Optional[tk.Label] = None
        self.management_message_label: Optional[tk.Label] = None

        # Copy defaults so mutations do not affect imported constants
        self.favorites = list(DEFAULT_FAVORITES)

        self.llm_urls = list(DEFAULT_LLM_URLS)

        # Preview state
        self.preview_visible: bool = False
        self.preview_dirty: bool = True  # mark preview needing rebuild

    def _init_root(self) -> None:
        if HAS_DND:
            self.root = TkinterDnD.Tk()
        else:
            self.root = tk.Tk()

        self.root.title("Scriptboard")
        self.root.configure(bg=UI.BG)
        self.root.geometry("320x550")
        self.root.minsize(320, 550)
        self.root.resizable(True, True)

        # Lock size toggle variable (created after root exists)
        try:
            self.lock_size_var = tk.BooleanVar(master=self.root, value=False)
        except Exception:
            # fallback to plain bool if creation fails
            self.lock_size_var = False
        # Always-on-top toggle variable
        try:
            self.topmost_var = tk.BooleanVar(master=self.root, value=False)
        except Exception:
            self.topmost_var = False
        # Show size toggle variable
        try:
            self.show_size_var = tk.BooleanVar(master=self.root, value=False)
        except Exception:
            self.show_size_var = False

        # Widget visibility toggles
        try:
            self.view_favorites_var = tk.BooleanVar(master=self.root, value=True)
            self.view_prompts_var = tk.BooleanVar(master=self.root, value=True)
            self.view_attachments_var = tk.BooleanVar(master=self.root, value=True)
            self.view_responses_var = tk.BooleanVar(master=self.root, value=True)
            self.view_manager_var = tk.BooleanVar(master=self.root, value=True)
        except Exception:
            self.view_favorites_var = True
            self.view_prompts_var = True
            self.view_attachments_var = True
            self.view_responses_var = True
            self.view_manager_var = True

    # ------------------------------------------------------------------ #
    # UI building
    # ------------------------------------------------------------------ #

    def _build_ui(self) -> None:
        # Menu should be built early so it appears at the top
        self._build_menu()

        # Create containers for toggleable sections
        self.container_favorites = tk.Frame(self.root, bg=UI.BG)
        self.container_prompts = tk.Frame(self.root, bg=UI.BG)
        self.container_attachments = tk.Frame(self.root, bg=UI.BG)
        self.container_responses = tk.Frame(self.root, bg=UI.BG)
        self.container_manager = tk.Frame(self.root, bg=UI.BG)

        # Build content into containers
        self._build_favorites(self.container_favorites)
        self._build_section_divider(self.container_favorites, pady=Layout.DIVIDER_PAD)

        self._build_prompt_section(self.container_prompts)
        
        self._build_attachments_section(self.container_attachments)
        self._build_section_divider(self.container_attachments)

        self._build_responses_section(self.container_responses)
        
        self._build_attachments_section(self.container_manager, variant="global")

        self._build_preview()
        self._build_status_bar()

        # Initial layout refresh
        self._refresh_layout()

    def _refresh_layout(self) -> None:
        # Repack logic for toggleable sections
        containers = [
            (self.view_favorites_var, self.container_favorites),
            (self.view_prompts_var, self.container_prompts),
            (self.view_attachments_var, self.container_attachments),
            (self.view_responses_var, self.container_responses),
            (self.view_manager_var, self.container_manager),
        ]

        # First forget all to ensure order
        for _, container in containers:
            container.pack_forget()
        
        if hasattr(self, "preview_frame"):
            self.preview_frame.pack_forget()

        # Pack visible ones
        for var, container in containers:
            try:
                visible = var.get()
            except Exception:
                visible = var # fallback if bool
            
            if visible:
                container.pack(fill=tk.X)

        # Repack preview if it was visible
        if self.preview_visible and hasattr(self, "preview_frame"):
            self.preview_frame.pack(fill=tk.BOTH, expand=True)

    def _build_favorites(self, parent: tk.Widget) -> None:
        self.fav_frame = tk.Frame(parent, bg=UI.BG)
        # Add side padding to align content away from the very edge
        self.fav_frame.pack(pady=Layout.FAVORITES_PAD, fill=tk.X, padx=20)
        self._render_favorites()

    def _render_favorites(self) -> None:
        # Clear existing buttons
        for child in getattr(self, "fav_frame", []).winfo_children():
            child.destroy()

        # Container for centering
        inner_frame = tk.Frame(self.fav_frame, bg=UI.BG)
        inner_frame.pack(anchor=tk.CENTER)

        # Add button to create a new favorite
        add_btn = tk.Button(
            inner_frame,
            text="Add+",
            bg=UI.BUTTON_PRIMARY,
            fg="white",
            activebackground=UI.BUTTON_PRIMARY_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.add_favorite,
        )
        add_btn.pack(side=tk.LEFT, padx=2)

        # Existing favorites
        for idx, (label, path) in enumerate(self.favorites):
            btn = tk.Button(
                inner_frame,
                text=label if path else "★",
                bg=UI.BUTTON_BG,
                fg=UI.ACCENT if path else UI.MUTED_ALT,
                activebackground=UI.BUTTON_ACTIVE,
                font=UI.FONT_BASE,
                width=8,
                cursor="hand2",
                command=lambda p=path: self.open_favorite(p),
            )
            btn.pack(side=tk.LEFT, padx=2)
            # Right-click to remove favorite
            btn.bind("<Button-3>", lambda e, i=idx: self.remove_favorite(i))

    def _build_prompt_section(self, parent: tk.Widget) -> None:
        frame = tk.Frame(parent, bg=UI.BG)
        frame.pack(fill=tk.X, padx=20, pady=Layout.SECTION_PAD)
        if HAS_DND:
            frame.drop_target_register(DND_FILES)
            frame.dnd_bind("<<Drop>>", self.handle_prompt_drop)

        # Row holds the inline buttons and the prompt status field below them
        row = tk.Frame(frame, bg=UI.BG)
        row.pack(fill=tk.X, pady=Layout.ROW_PAD)

        # Inline buttons row (prompt status will be placed below)
        btn_row = tk.Frame(row, bg=UI.BG)
        btn_row.pack(anchor=tk.CENTER)

        tk.Button(
            btn_row,
            text="Load",
            bg=UI.BUTTON_PRIMARY,
            fg="white",
            activebackground=UI.BUTTON_PRIMARY_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.load_prompt,
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            btn_row,
            text="Paste",
            bg=UI.BUTTON_BG,
            fg=UI.TEXT,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.set_prompt,
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            btn_row,
            text="View",
            bg=UI.BUTTON_BG,
            fg=UI.MUTED,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.view_prompt,
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            btn_row,
            text="Clear",
            bg=UI.BUTTON_BG,
            fg=UI.MUTED,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.clear_prompt,
        ).pack(side=tk.LEFT, padx=(0, 5))

        # Prompt status placed below the inline buttons
        self.prompt_status = tk.Label(
            row,
            text="No prompt",
            font=("Segoe UI", 10),
            fg=UI.MUTED_ALT,
            bg=UI.PANEL,
            padx=10,
            pady=5,
            width=36,
            anchor=tk.W,
        )
        # Place the prompt status under the buttons
        self.prompt_status.pack(fill=tk.X, expand=True, pady=Layout.STATUS_PAD)

        separator = tk.Frame(parent, bg=UI.BORDER, height=1)
        separator.pack(fill=tk.X, padx=20, pady=Layout.DIVIDER_PAD)

    def _build_responses_section(self, parent: tk.Widget) -> None:
        frame = tk.Frame(parent, bg=UI.BG)
        frame.pack(fill=tk.X, padx=20, pady=Layout.SECTION_PAD)

        row = tk.Frame(frame, bg=UI.BG)
        row.pack(fill=tk.X, pady=Layout.ROW_PAD)

        btn_row = tk.Frame(row, bg=UI.BG)
        btn_row.pack(anchor=tk.CENTER)

        tk.Button(
            btn_row,
            text="LLMs",
            bg=UI.BUTTON_PRIMARY,
            fg="white",
            activebackground=UI.BUTTON_PRIMARY_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.open_all_llms,
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            btn_row,
            text="Paste",
            bg=UI.BUTTON_BG,
            fg=UI.TEXT,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.paste,
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            btn_row,
            text="View",
            bg=UI.BUTTON_BG,
            fg=UI.MUTED,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.view_responses,
        ).pack(side=tk.LEFT, padx=(0, 5))

        tk.Button(
            btn_row,
            text="Clear",
            bg=UI.BUTTON_BG,
            fg=UI.MUTED,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=self.clear,
        ).pack(side=tk.LEFT, padx=(0, 5))

        status_row = tk.Frame(row, bg=UI.PANEL)
        status_row.pack(fill=tk.X, pady=Layout.STATUS_PAD)

        self.response_status = tk.Label(
            status_row,
            text="Responses: 0 | Characters: 0",
            font=("Segoe UI", 10),
            fg=UI.MUTED_ALT,
            bg=UI.PANEL,
            padx=10,
            pady=5,
            width=36,
            anchor=tk.W,
        )
        self.response_status.pack(side=tk.LEFT, fill=tk.X, expand=True)

        separator = tk.Frame(parent, bg=UI.BORDER, height=1)
        separator.pack(fill=tk.X, padx=20, pady=Layout.DIVIDER_PAD)

    def _build_attachments_section(self, parent: tk.Widget, variant: str = "attachments", title: str | None = None) -> None:
        frame = tk.Frame(parent, bg=UI.BG)
        frame.pack(fill=tk.X, padx=20, pady=Layout.SECTION_PAD)
        if HAS_DND:
            handler = self.handle_drop if variant == "attachments" else self.handle_drop
            frame.drop_target_register(DND_FILES)
            frame.dnd_bind("<<Drop>>", handler)

        # Optional section title
        if title:
            tk.Label(
                frame,
                text=title,
                font=("Segoe UI", 10, "bold"),
                fg=UI.TEXT,
                bg=UI.BG,
                anchor=tk.W,
            ).pack(fill=tk.X, pady=(0, 4))

        row = tk.Frame(frame, bg=UI.BG)
        row.pack(fill=tk.X, pady=Layout.ROW_PAD)

        btn_row = tk.Frame(row, bg=UI.BG)
        btn_row.pack(anchor=tk.CENTER)

        primary_text = "Load" if variant == "attachments" else "Copy All"
        primary_command = self.attach_file if variant == "attachments" else self.copy_all
        tk.Button(
            btn_row,
            text=primary_text,
            bg=UI.BUTTON_PRIMARY,
            fg="white",
            activebackground=UI.BUTTON_PRIMARY_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=primary_command,
        ).pack(side=tk.LEFT, padx=(0, 5))

        secondary_text = "Paste" if variant == "attachments" else "Save As"
        secondary_command = self.paste_code if variant == "attachments" else self.save_clipboard_to_dir
        tk.Button(
            btn_row,
            text=secondary_text,
            bg=UI.BUTTON_BG,
            fg=UI.TEXT,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=secondary_command,
        ).pack(side=tk.LEFT, padx=(0, 5))

        view_command = self.view_attachments if variant == "attachments" else self.view_combined_preview
        tk.Button(
            btn_row,
            text="View",
            bg=UI.BUTTON_BG,
            fg=UI.MUTED,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=view_command,
        ).pack(side=tk.LEFT, padx=(0, 5))

        clear_text = "Clear" if variant == "attachments" else "Clear All"
        clear_command = self.clear_attachments if variant == "attachments" else self.clear
        tk.Button(
            btn_row,
            text=clear_text,
            bg=UI.BUTTON_BG,
            fg=UI.MUTED,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=8,
            cursor="hand2",
            command=clear_command,
        ).pack(side=tk.LEFT, padx=(0, 5))

        status_text = "No attachments" if variant == "attachments" else "Prompts: 0 | Attachments: 0 | Responses: 0"
        status_label = tk.Label(
            row,
            text=status_text,
            font=("Segoe UI", 10),
            fg=UI.MUTED_ALT,
            bg=UI.PANEL,
            padx=10,
            pady=5,
            width=36,
            anchor=tk.W,
        )
        status_label.pack(fill=tk.X, expand=True, pady=Layout.STATUS_PAD)

        if variant == "attachments":
            self.attach_status_labels.append(status_label)
        else:
            self.management_status_label = status_label
            # Persistent feedback message below management field
            self.management_message_label = tk.Label(
                row,
                text="",
                font=("Segoe UI", 9),
                fg=UI.MUTED_ALT,
                bg=UI.BG,
                anchor=tk.CENTER,
                justify=tk.CENTER,
            )
            self.management_message_label.pack(fill=tk.X, pady=(0, 4))

    def _build_section_divider(self, parent: tk.Widget, pady: tuple[int, int] = Layout.DIVIDER_PAD) -> None:
        separator = tk.Frame(parent, bg=UI.BORDER, height=1)
        separator.pack(fill=tk.X, padx=20, pady=pady)

    def _build_preview(self) -> None:
        self.preview_frame = tk.Frame(self.root, bg=UI.BG)
        self.preview = scrolledtext.ScrolledText(
            self.preview_frame,
            font=UI.FONT_MONO,
            bg=UI.PANEL,
            fg=UI.TEXT,
            insertbackground=UI.TEXT,
            height=8,
            wrap=tk.WORD,
        )
        self.preview.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

    def _build_status_bar(self) -> None:
        # Footer frame with top border and controls
        status_frame = tk.Frame(self.root, bg=UI.BG)
        status_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=0, padx=12)

        border = tk.Frame(status_frame, bg=UI.BORDER, height=1)
        border.pack(fill=tk.X, pady=(0, 2))

        row = tk.Frame(status_frame, bg=UI.BG)
        row.pack(fill=tk.X)

        self.status = tk.Label(
            row,
            text="",
            font=UI.FONT_BASE,
            fg=UI.MUTED,
            bg=UI.BG,
        )
        self.status.pack(side=tk.LEFT, padx=8)

        self.size_label = tk.Label(
            row,
            text="",
            font=UI.FONT_BASE,
            fg=UI.MUTED,
            bg=UI.BG,
        )
        # Pre-pack in the desired position; visibility is controlled via _update_size_visibility

        self.char_count_label = tk.Label(
            row,
            text="Chars: 0",
            font=UI.FONT_BASE,
            fg=UI.MUTED,
            bg=UI.BG,
        )
        self.char_count_label.pack(side=tk.LEFT, padx=8)

        # Lock Size checkbox (uses lock_size_var)
        try:
            lock_cb = tk.Checkbutton(
                row,
                text="Lock Size",
                variable=self.lock_size_var,
                command=self._on_lock_size_toggle,
                bg=UI.BG,
                fg=UI.MUTED,
                selectcolor=UI.BG,
                activebackground=UI.BG,
                font=("Segoe UI", 9),
            )
            # Pack lock and topmost checkboxes on the right
            lock_cb.pack(side=tk.RIGHT, padx=8)
            try:
                top_cb = tk.Checkbutton(
                    row,
                    text="On Top",
                    variable=self.topmost_var,
                    command=self._on_topmost_toggle,
                    bg=UI.BG,
                    fg=UI.MUTED,
                    selectcolor=UI.BG,
                    activebackground=UI.BG,
                    font=("Segoe UI", 9),
                )
                top_cb.pack(side=tk.RIGHT, padx=8)
            except Exception:
                # fallback: show a label if topmost checkbox can't be built
                if isinstance(getattr(self, "topmost_var", None), bool):
                    lbl = tk.Label(row, text="Top (unavailable)", fg=UI.MUTED, bg=UI.BG)
                    lbl.pack(side=tk.RIGHT, padx=8)
        except Exception:
            # If lock_size_var is a plain bool fallback, create a disabled label instead
            if isinstance(getattr(self, "lock_size_var", None), bool):
                lbl = tk.Label(row, text="Lock Size (unavailable)", fg=UI.MUTED, bg=UI.BG)
                lbl.pack(side=tk.RIGHT, padx=8)

        # Initial footer refresh
        self._update_inline_status()
        self._update_size_visibility()

    def _create_content_window(
        self,
        title: str,
        content_builder,
        size: tuple[int, int] | None = (500, 400),
        modal: bool = False,
        geometry: str | None = None,
    ) -> tk.Toplevel:
        """Reusable window builder for read-only content views."""
        win = tk.Toplevel(self.root)
        win.title(title)
        win.configure(bg=UI.BG)

        if geometry:
            win.geometry(geometry)
        elif size:
            try:
                w, h = size
                win.geometry(f"{w}x{h}")
            except Exception:
                pass

        if modal:
            try:
                win.transient(self.root)
                win.grab_set()
            except Exception:
                pass

        st = scrolledtext.ScrolledText(
            win,
            font=UI.FONT_MONO,
            bg=UI.PANEL,
            fg=UI.TEXT,
            insertbackground=UI.TEXT,
            wrap=tk.WORD,
        )
        st.pack(fill=tk.BOTH, expand=True, padx=12, pady=(12, 6))

        try:
            content = content_builder() or ""
        except Exception as e:
            content = f"(Error building content: {e})"
        st.insert("1.0", content if content.strip() else "(No content)")
        st.config(state=tk.DISABLED)

        footer = tk.Frame(win, bg=UI.BG)
        footer.pack(fill=tk.X, padx=12, pady=(0, 12))
        tk.Button(
            footer,
            text="Close",
            bg=UI.BUTTON_BG,
            fg=UI.TEXT,
            activebackground=UI.BUTTON_ACTIVE,
            font=UI.FONT_BASE,
            width=10,
            cursor="hand2",
            command=win.destroy,
        ).pack(side=tk.RIGHT)

        return win

    def _build_menu(self) -> None:
        menubar = tk.Menu(self.root)

        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="Exit", command=self.root.quit)
        menubar.add_cascade(label="File", menu=file_menu)

        # Prompts menu
        prompts_menu = tk.Menu(menubar, tearoff=0)
        for key, (title, text) in PRELOADED_PROMPTS.items():
            prompts_menu.add_command(
                label=f"{key}: {title}", 
                command=lambda lbl=title, t=text: self._load_predefined_prompt(lbl, t)
            )
        menubar.add_cascade(label="Prompts", menu=prompts_menu)

        # View menu
        view_menu = tk.Menu(menubar, tearoff=0)
        view_menu.add_checkbutton(label="Favorites", variable=self.view_favorites_var, command=self._refresh_layout)
        view_menu.add_checkbutton(label="Prompts", variable=self.view_prompts_var, command=self._refresh_layout)
        view_menu.add_checkbutton(label="Attachments", variable=self.view_attachments_var, command=self._refresh_layout)
        view_menu.add_checkbutton(label="Responses", variable=self.view_responses_var, command=self._refresh_layout)
        view_menu.add_checkbutton(label="Manager", variable=self.view_manager_var, command=self._refresh_layout)
        view_menu.add_separator()
        view_menu.add_checkbutton(
            label="Show Size",
            variable=self.show_size_var,
            command=self._update_size_visibility,
            onvalue=True,
            offvalue=False,
        )
        menubar.add_cascade(label="View", menu=view_menu)

        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="Open All LLMs", command=self.open_all_llms)
        help_menu.add_command(label="Keyboard Shortcuts", command=self.show_shortcuts)
        help_menu.add_command(label="About", command=lambda: self.show_status("Scriptboard"))
        menubar.add_cascade(label="Help", menu=help_menu)

        self.root.config(menu=menubar)


    # ------------------------------------------------------------------ #
    # Shortcuts / bindings
    # ------------------------------------------------------------------ #

    def _bind_shortcuts(self) -> None:
        # Clipboard / core actions
        self.root.bind("<Control-v>", lambda e: self.paste())
        self.root.bind("<Control-V>", lambda e: self.paste())
        self.root.bind("<Control-Shift-V>", lambda e: self.paste_code())
        self.root.bind("<Control-Shift-v>", lambda e: self.paste_code())
        self.root.bind("<Control-c>", lambda e: self.copy_all())
        self.root.bind("<Control-C>", lambda e: self.copy_all())

        # Prompt
        self.root.bind("<Control-l>", lambda e: self.load_prompt())
        self.root.bind("<Control-L>", lambda e: self.load_prompt())

        # View toggle
        self.root.bind("<Control-b>", lambda e: self.toggle_view())

    def _bind_window_size(self) -> None:
        try:
            self.root.bind("<Configure>", lambda e: self._update_window_size_label())
            self._update_window_size_label()
        except Exception:
            pass

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    def show_status(self, message: str, timeout_ms: int = 2000) -> None:
        self.status.config(text=message)
        if timeout_ms:
            self.root.after(timeout_ms, lambda: self.status.config(text=""))

    def _update_inline_status(self) -> None:
        """Update the inline summary of prompts, attachments, and responses."""
        try:
            prompt_count = 1 if self.prompt else 0
            attach_count = len(self.attachments)
            resp_count = len(self.responses)
            if getattr(self, "management_status_label", None):
                base_text = f"Prompts: {prompt_count} | Attachments: {attach_count} | Responses: {resp_count}"
                self.management_status_label.config(
                    text=base_text,
                    fg=UI.ACCENT if (prompt_count or attach_count or resp_count) else UI.MUTED_ALT,
                )
            if getattr(self, "char_count_label", None):
                total_chars = len(self.prompt) if self.prompt else 0
                total_chars += sum(len(a.content) for a in self.attachments)
                total_chars += sum(len(r["content"]) for r in self.responses)
                self.char_count_label.config(
                    text=f"Chars: {total_chars:,}",
                    fg=UI.ACCENT if total_chars else UI.MUTED_ALT,
                )
        except Exception:
            pass

    def _show_management_message(self, message: str, timeout_ms: int = 2000) -> None:
        """Temporarily show a message beneath the management status field."""
        if not getattr(self, "management_message_label", None):
            return
        try:
            self.management_message_label.config(text=message, fg=UI.ACCENT)
            if timeout_ms:
                self.root.after(timeout_ms, lambda: self.management_message_label.config(text="", fg=UI.MUTED_ALT))
        except Exception:
            pass

    def _get_clipboard_text(self) -> Optional[str]:
        try:
            text = pyperclip.paste()
        except Exception as e:
            self.show_status(f"Clipboard error: {e}")
            return None
        if not text or not text.strip():
            self.show_status("Clipboard empty")
            return None
        return text.strip()

    def _truncate_lines(self, text: str, max_lines: int = 3) -> str:
        """Limit text to a maximum number of lines, appending ellipsis when truncated."""
        lines = text.splitlines()
        if len(lines) <= max_lines:
            return text
        truncated = lines[:max_lines]
        truncated.append("...")
        return "\n".join(truncated)

    def _update_size_visibility(self) -> None:
        """Show or hide the footer size label based on the View toggle."""
        try:
            show = bool(self.show_size_var.get())
        except Exception:
            try:
                show = bool(self.show_size_var)
            except Exception:
                show = True

        try:
            if show:
                if not self.size_label.winfo_ismapped():
                    self.size_label.pack(side=tk.LEFT, padx=8, before=self.char_count_label)
            else:
                if self.size_label.winfo_ismapped():
                    self.size_label.pack_forget()
        except Exception:
            pass

    def _on_lock_size_toggle(self) -> None:
        # Toggle window size lock. If lock_size_var is a BooleanVar, use .get();
        # if it's a plain bool fallback, just ignore.
        try:
            locked = bool(self.lock_size_var.get())
        except Exception:
            try:
                locked = bool(self.lock_size_var)
            except Exception:
                self.show_status("Lock unavailable")
                return

        try:
            if locked:
                # fix current size
                self.root.update_idletasks()
                w = self.root.winfo_width()
                h = self.root.winfo_height()
                self.root.resizable(False, False)
                self.root.minsize(w, h)
                self.root.maxsize(w, h)
                self.show_status("Size locked")
            else:
                # allow resizing again
                self.root.resizable(True, True)
                self.root.minsize(350, 550)
                self.root.maxsize(10000, 10000)
                self.show_status("Size unlocked")
        except Exception as e:
            self.show_status(f"Error toggling lock: {e}")

    def _on_topmost_toggle(self) -> None:
        # Toggle window always-on-top. Handles BooleanVar or plain bool fallback.
        try:
            top = bool(self.topmost_var.get())
        except Exception:
            try:
                top = bool(self.topmost_var)
            except Exception:
                self.show_status("Topmost unavailable")
                return

        try:
            self.root.attributes("-topmost", bool(top))
            self.show_status("Always on top" if top else "Not topmost")
        except Exception as e:
            self.show_status(f"Error toggling topmost: {e}")

    def _update_window_size_label(self) -> None:
        try:
            w = self.root.winfo_width()
            h = self.root.winfo_height()
            self.size_label.config(text=f"{w} x {h}")
        except Exception:
            pass

    def _file_picker(
        self,
        title: str,
        filetypes,
        initial_dir: Optional[str] = None,
    ) -> str:
        return filedialog.askopenfilename(
            title=title,
            filetypes=filetypes,
            initialdir=initial_dir or self.feature_folder or os.path.expanduser("~"),
        )

    # ------------------------------------------------------------------ #
    # Favorites / prompt
    # ------------------------------------------------------------------ #

    def show_shortcuts(self) -> None:
        """Display key shortcuts and quick actions."""
        shortcuts = (
            "Ctrl+V    Paste response\n"
            "Ctrl+Shift+V  Paste code as attachment\n"
            "Ctrl+C    Copy all JSON\n"
            "Ctrl+L    Load prompt (file)\n"
            "Ctrl+B    Toggle preview\n"
        )
        try:
            messagebox.showinfo("Keyboard Shortcuts", shortcuts, parent=self.root)
        except Exception:
            # Fallback to status bar if messagebox unavailable
            self.show_status("Shortcuts: Ctrl+V (paste), Ctrl+Shift+V (attach), Ctrl+C (copy all), Ctrl+L (load), Ctrl+B (preview)", timeout_ms=4000)

    def open_favorite(self, path: Optional[str]) -> None:
        if not path:
            self.show_status("Favorite not set")
            return

        filepath = self._file_picker(
            title="Select llm-prompt.json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initial_dir=path,
        )
        if filepath:
            self._load_file(filepath)

    def add_favorite(self) -> None:
        """Open a folder picker and add a new favorite entry."""
        path = filedialog.askdirectory(
            title="Select favorite folder",
            initialdir=self.feature_folder or os.path.expanduser("~"),
        )
        if not path:
            return

        label = os.path.basename(path.rstrip("\\/")) or "Favorite"
        self.favorites.append((label, path))
        self._render_favorites()
        self.show_status(f"Added favorite: {label}")

    def remove_favorite(self, index: int) -> None:
        """Remove a favorite by index (invoked via right-click on favorite button)."""
        try:
            label, _ = self.favorites[index]
        except Exception:
            return

        try:
            if not messagebox.askyesno("Remove Favorite", f"Remove '{label}'?", parent=self.root):
                return
        except Exception:
            # If messagebox fails, continue without confirmation
            pass

        try:
            self.favorites.pop(index)
            self._render_favorites()
            self.show_status(f"Removed favorite: {label}")
        except Exception as e:
            self.show_status(f"Error removing favorite: {e}")

    def _load_file(self, filepath: str) -> None:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self.prompt = content.strip()
            self.prompt_paste_count = 0
            self.feature_folder = os.path.dirname(filepath)
            feature_name = os.path.basename(self.feature_folder)
            self._update_prompt_status()
            self.preview_dirty = True
            self.show_status(f"Loaded from {feature_name}")
            self._update_inline_status()
        except Exception as e:
            self.show_status(f"Error: {e}")

    def load_prompt(self) -> None:
        filepath = self._file_picker(
            title="Select llm-prompt.json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initial_dir=os.path.expanduser("~/.mcp-servers/docs-mcp/coderef/working"),
        )
        if filepath:
            self._load_file(filepath)

    def set_prompt(self) -> None:
        text = self._get_clipboard_text()
        if not text:
            return
        self.prompt = text
        self.prompt_source = "Clipboard"
        self.prompt_paste_count += 1
        self._update_prompt_status()
        self.preview_dirty = True
        self._show_management_message("Prompt pasted", timeout_ms=2000)
        self._update_inline_status()

    def clear_prompt(self) -> None:
        self.prompt = ""
        self.prompt_source = None
        self.prompt_paste_count = 0
        self._update_prompt_status()
        self.preview_dirty = True
        self.show_status("Prompt cleared")
        self._update_inline_status()

    def view_prompt(self) -> None:
        self._create_content_window(
            title="Prompt",
            content_builder=lambda: self._build_prompt_content(),
            size=(500, 400),
            modal=False,
        )

    def _load_predefined_prompt(self, name: str, text: str) -> None:
        self.prompt = text
        self.prompt_source = name
        self.prompt_paste_count = 0
        self.feature_folder = None
        self._update_prompt_status()
        self.preview_dirty = True
        self.show_status(f"Loaded {name}")
        self._update_inline_status()

    def _update_prompt_status(self) -> None:
        if not self.prompt:
            self.prompt_status.config(text="No prompt", fg=UI.MUTED_ALT)
            return
        
        # Display source name if available, otherwise truncated preview
        if self.prompt_source:
             display_text = f"[{self.prompt_source}]"
             self.prompt_status.config(text=display_text, fg=UI.ACCENT)
             return

        if self.prompt_paste_count > 0:
            label = "Prompt Accepted" if self.prompt_paste_count == 1 else f"Prompts Accepted: {self.prompt_paste_count}"
            self.prompt_status.config(text=label, fg=UI.ACCENT)
            return

        preview = self.prompt[:30] + "..." if len(self.prompt) > 30 else self.prompt
        self.prompt_status.config(text=preview, fg=UI.ACCENT)

    # ------------------------------------------------------------------ #
    # Attachments
    # ------------------------------------------------------------------ #

    def attach_file(self) -> None:
        filetypes = [
            ("Code files", "*.py *.js *.ts *.tsx *.jsx *.json *.md *.txt *.html *.css"),
            ("Python", "*.py"),
            ("JavaScript", "*.js *.jsx"),
            ("TypeScript", "*.ts *.tsx"),
            ("All files", "*.*"),
        ]
        filepath = self._file_picker(
            title="Select file to attach",
            filetypes=filetypes,
        )
        if filepath:
            self._attach_from_path(filepath)

    def _attach_from_path(self, filepath: str) -> None:
        MAX_ATTACH_SIZE = 2_000_000  # 2 MB guardrail

        try:
            if os.path.getsize(filepath) > MAX_ATTACH_SIZE:
                self.show_status("File too large to attach")
                return

            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            filename = os.path.basename(filepath)
            self.attachments.append(Attachment(filename=filename, content=content))
            self._update_attach_status()
            self._update_inline_status()
            self.preview_dirty = True
            self._show_management_message(f"Attached {filename}", timeout_ms=2000)
        except Exception as e:
            self.show_status(f"Error: {e}")

    def handle_drop(self, event) -> None:
        files = self.root.tk.splitlist(event.data)
        for filepath in files:
            filepath = filepath.strip("{}")  # Windows drag-drop paths
            self._attach_from_path(filepath)

    def handle_prompt_drop(self, event) -> None:
        files = self.root.tk.splitlist(event.data)
        if not files:
            return
        filepath = files[0].strip("{}")
        if filepath:
            self._load_file(filepath)

    def paste_code(self) -> None:
        text = self._get_clipboard_text()
        if not text:
            return

        # Auto-generate a filename to avoid interrupting the paste flow.
        base_name = "clipboard"
        idx = len(self.attachments) + 1
        filename = f"{base_name}-{idx}.txt"

        attachment = Attachment(filename=filename, content=text)
        self.attachments.append(attachment)
        self._update_attach_status()
        self._update_inline_status()
        self.preview_dirty = True
        self._show_management_message(f"Pasted as {filename}", timeout_ms=2000)

    def save_clipboard_to_dir(self) -> None:
        """Save current clipboard text to a chosen directory as a file."""
        text = self._get_clipboard_text()
        if not text:
            return

        target_dir = filedialog.askdirectory(
            title="Save clipboard to folder",
            initialdir=self.feature_folder or os.path.expanduser("~"),
        )
        if not target_dir:
            return

        base_name = "clipboard"
        idx = len(self.attachments) + 1
        default_name = f"{base_name}-{idx}.txt"
        filename = simpledialog.askstring(
            "Save As",
            "Filename:",
            initialvalue=default_name,
            parent=self.root,
        )
        if not filename:
            return
        filepath = os.path.join(target_dir, filename)

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(text)
            self._show_management_message(f"Saved as {filename}", timeout_ms=2000)
        except Exception as e:
            self.show_status(f"Save error: {e}")

    def clear_attachments(self) -> None:
        self.attachments.clear()
        self._update_attach_status()
        self._update_inline_status()
        self.preview_dirty = True
        self.show_status("Attachments cleared")

    def view_attachments(self) -> None:
        self._create_content_window(
            title="Attached Files",
            content_builder=lambda: self._build_attachments_content(),
            size=(500, 400),
            modal=False,
        )

    def view_responses(self) -> None:
        self._create_content_window(
            title="Responses",
            content_builder=lambda: self._build_responses_content(),
            size=(500, 400),
            modal=False,
        )

    def _update_attach_status(self) -> None:
        count = len(self.attachments)
        if not self.attach_status_labels:
            self._update_inline_status()
            return

        if count == 0:
            for lbl in self.attach_status_labels:
                lbl.config(text="No attachments", fg=UI.MUTED_ALT)
            self._update_inline_status()
            return

        total_lines = sum(a.lines for a in self.attachments)
        names = ", ".join(a.filename for a in self.attachments[:2])
        if count > 2:
            names += f" +{count - 2}"
        for lbl in self.attach_status_labels:
            lbl.config(
                text=f"📎 {names} ({total_lines} lines)",
                fg=UI.ACCENT,
            )
        self._update_inline_status()

    # ------------------------------------------------------------------ #
    # Responses
    # ------------------------------------------------------------------ #

    def paste(self) -> None:
        # Immediate-paste behavior: add clipboard content directly as a response
        # with source marked as 'Clipboard'. This replaces the previous
        # tag-first workflow where the user was prompted to pick an LLM.
        text = self._get_clipboard_text()
        if not text:
            return

        # Size guard: confirm with user for very large clipboard contents
        try:
            if len(text) > 200_000:
                if not tk.messagebox.askyesno(
                    "Large paste",
                    "Clipboard content is very large. Add anyway?",
                ):
                    self.show_status("Paste cancelled")
                    return
        except Exception:
            # If messagebox is unavailable for some reason, continue
            pass

        # Append directly as a 'Clipboard' response
        try:
            self.responses.append({"source": "Clipboard", "content": text})
            self._update_counter()
            self.preview_dirty = True
            self._show_management_message("Response pasted", timeout_ms=2000)
        except Exception as e:
            self.show_status(f"Error adding response: {e}")

    def _update_counter(self) -> None:
        count = len(self.responses)
        total_chars = sum(len(r["content"]) for r in self.responses)
        display = f"Responses: {count} | Characters: {total_chars:,}"

        try:
            fg = UI.ACCENT if count else UI.MUTED_ALT
            self.response_status.config(text=display, fg=fg)
        except Exception:
            pass
        self._update_inline_status()

    # ------------------------------------------------------------------ #
    # Preview
    # ------------------------------------------------------------------ #

    def _build_prompt_content(self) -> str:
        return self._truncate_lines(self.prompt or "", max_lines=3)

    def _build_attachments_content(self) -> str:
        parts: List[str] = []
        for att in self.attachments:
            preview = self._truncate_lines(att.content, max_lines=3)
            parts.append(f"📎 {att.filename} ({att.lines} lines)\n{preview}")
        return "\n\n".join(parts)

    def _build_responses_content(self) -> str:
        if not self.responses:
            return ""

        bodies: List[str] = []
        for resp in self.responses:
            body = self._truncate_lines(resp["content"], max_lines=3)
            bodies.append(f"[{resp.get('source', 'Unknown')}] {body}")
        return "\n\n---\n\n".join(bodies)

    def toggle_view(self) -> None:
        # Toggle the preview frame. Set the visible flag before calling
        # `update_preview()` so that `update_preview()` can check
        # `self.preview_visible` and actually render content.
        if self.preview_visible:
            self.preview_frame.pack_forget()
            self.preview_visible = False
        else:
            self.preview_frame.pack(fill=tk.BOTH, expand=True)
            # Mark dirty and set visible before updating so update_preview
            # will run and populate the preview text.
            self.preview_dirty = True
            self.preview_visible = True
            self.update_preview()

    def update_preview(self) -> None:
        if not self.preview_visible or not self.preview_dirty:
            return

        self.preview_dirty = False
        self.preview.delete("1.0", tk.END)

        # Use the reusable builder so modal and embedded previews match.
        text = self._build_preview_text()
        self.preview.insert("1.0", text)

    def _build_preview_text(self) -> str:
        """Return the preview text that would be shown in the preview area."""
        parts: List[str] = []

        if self.prompt:
            parts.append(f"=== PROMPT ===\n{self._truncate_lines(self.prompt, max_lines=3)}")

        if self.attachments:
            attach_parts: List[str] = []
            for att in self.attachments:
                preview_content = self._truncate_lines(att.content, max_lines=3)
                attach_parts.append(f"--- {att.filename} ({att.lines} lines) ---\n{preview_content}")
            parts.append("=== ATTACHMENTS ===\n" + "\n\n".join(attach_parts))

        if self.responses:
            # Each response body will be separated by: blank line, '---', blank line
            # so join them with the separator '\n\n---\n\n'.
            resp_bodies: List[str] = []
            for resp in self.responses:
                preview_content = self._truncate_lines(resp["content"], max_lines=3)
                resp_bodies.append(preview_content)

            separator = "\n\n---\n\n"
            parts.append("=== RESPONSES ===\n" + separator.join(resp_bodies))

        return "\n\n".join(parts)

    def view_combined_preview(self) -> None:
        """Modal-like combined preview using the same sizing/truncation style as other views."""
        self._create_content_window(
            title="Preview",
            content_builder=lambda: self._build_combined_preview_content(),
            size=(500, 400),
            modal=False,
        )

    def _build_combined_preview_content(self) -> str:
        """Combined preview with truncated sections, matching other view modals."""
        parts: List[str] = []

        if self.prompt:
            parts.append(f"=== PROMPT ===\n{self._truncate_lines(self.prompt, max_lines=3)}")

        if self.attachments:
            attach_parts: List[str] = []
            for att in self.attachments:
                preview = self._truncate_lines(att.content, max_lines=3)
                attach_parts.append(f"--- {att.filename} ({att.lines} lines) ---\n{preview}")
            parts.append("=== ATTACHMENTS ===\n" + "\n\n".join(attach_parts))

        if self.responses:
            resp_bodies: List[str] = []
            for resp in self.responses:
                preview = self._truncate_lines(resp["content"], max_lines=3)
                resp_bodies.append(preview)
            parts.append("=== RESPONSES ===\n" + "\n\n---\n\n".join(resp_bodies))

        return "\n\n".join(parts)

    # ------------------------------------------------------------------ #
    # Copy / clear
    # ------------------------------------------------------------------ #

    def copy_all(self) -> None:
        if not (self.prompt or self.attachments or self.responses):
            self.show_status("Nothing to copy")
            return

        output: Dict[str, object] = {
            "prompt": self.prompt or None,
            "attachments": [
                {"filename": a.filename, "content": a.content}
                for a in self.attachments
            ],
        }

        if self.responses:
            output["responses"] = [
                {"source": resp["source"], "content": resp["content"]}
                for resp in self.responses
            ]

        # Remove empty / None
        output = {
            k: v
            for k, v in output.items()
            if not (v is None or v == [] or v == {} or v == "")
        }

        combined = json.dumps(output, indent=2)
        try:
            pyperclip.copy(combined)
        except Exception as e:
            self.show_status(f"Clipboard error: {e}")
            return

        parts = []
        if self.prompt:
            parts.append("prompt")
        if self.attachments:
            parts.append(f"{len(self.attachments)} files")
        if self.responses:
            parts.append(f"{len(self.responses)} responses")

        self.show_status(f"Copied JSON: {' + '.join(parts)}")

    def clear(self) -> None:
        self.responses.clear()
        self.attachments.clear()
        self.prompt = ""
        self.prompt_paste_count = 0

        self._update_counter()
        self._update_attach_status()
        self._update_prompt_status()

        self.preview_dirty = True
        if self.preview_visible:
            self.update_preview()

        self._show_management_message("Cleared all", timeout_ms=2000)

    # ------------------------------------------------------------------ #
    # Browser helpers
    # ------------------------------------------------------------------ #

    def open_all_llms(self) -> None:
        urls = [url for _, url in self.llm_urls]

        # Try to launch a fresh Chrome window with all LLM tabs
        chrome_path = shutil.which("chrome") or shutil.which("google-chrome")
        if not chrome_path:
            # Common Windows install location fallback
            maybe_path = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
            if os.path.exists(maybe_path):
                chrome_path = maybe_path

        try:
            if chrome_path:
                subprocess.Popen([chrome_path, "--new-window", *urls])
            else:
                # Fallback: default browser new window/tab sequence
                if urls:
                    webbrowser.open_new(urls[0])
                    for url in urls[1:]:
                        webbrowser.open_new_tab(url)
            self.show_status(f"Opened {len(urls)} LLM tabs in new window")
        except Exception as e:
            self.show_status(f"Browser error: {e}")

    # ------------------------------------------------------------------ #
    # Main loop
    # ------------------------------------------------------------------ #

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    app = Scriptboard()
    app.run()
