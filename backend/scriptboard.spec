# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Scriptboard backend.
Builds a standalone executable that runs the FastAPI server.
"""

import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Collect all tiktoken data files (tokenizer models)
tiktoken_datas = collect_data_files('tiktoken')

# Collect all submodules for complex packages
fastapi_imports = collect_submodules('fastapi')
starlette_imports = collect_submodules('starlette')
uvicorn_imports = collect_submodules('uvicorn')
pydantic_imports = collect_submodules('pydantic')

# Hidden imports that PyInstaller might miss
hidden_imports = [
    # FastAPI and dependencies (explicit)
    'fastapi',
    'fastapi.applications',
    'fastapi.routing',
    'fastapi.params',
    'fastapi.responses',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'starlette',
    'starlette.applications',
    'starlette.routing',
    'starlette.middleware',
    'starlette.middleware.cors',
    'starlette.responses',
    'starlette.requests',
    'starlette.exceptions',
    'starlette.status',
    'pydantic',
    'pydantic_core',
    'pydantic.fields',
    'pydantic_settings',

    # Key logger dependencies
    'pynput',
    'pynput.keyboard',
    'pynput.mouse',
    'pyperclip',

    # Windows clipboard (optional, used as fallback)
    'win32clipboard',
    'win32con',
    'win32event',
    'win32api',

    # Token counting
    'tiktoken',
    'tiktoken_ext',
    'tiktoken_ext.openai_public',

    # Git integration
    'git',
    'gitdb',
    'smmap',

    # Environment and config
    'dotenv',
    'python-dotenv',

    # Standard library modules that might be missed
    'email.mime.text',
    'email.mime.multipart',
    'json',
    'pathlib',
    'typing',
    'asyncio',
    'concurrent.futures',
    'multiprocessing',
]

# Combine all hidden imports
all_hidden_imports = hidden_imports + fastapi_imports + starlette_imports + uvicorn_imports + pydantic_imports

a = Analysis(
    ['backend_entrypoint.py'],
    pathex=[],
    binaries=[],
    datas=tiktoken_datas,
    hiddenimports=all_hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'pytest',
        'httpx',
        'test',
        'tests',
        '_pytest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='scriptboard-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon path here if desired
)
